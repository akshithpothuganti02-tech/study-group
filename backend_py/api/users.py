from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from backend_py.shared.dynamodb import dynamodb, TABLES
from backend_py.shared.auth import get_current_user
from backend_py.shared.s3 import get_upload_presigned_url, get_download_presigned_url, list_group_files

router = APIRouter(prefix="/users", tags=["Users"])
table = dynamodb.Table(TABLES["USERS"])
groups_table = dynamodb.Table(TABLES["GROUPS"])

class UserProfileUpdate(BaseModel):
    name: str
    subjects: list[str]
    availability: list[str]

@router.get("/profile")
def get_user_profile(user: dict = Depends(get_current_user)):
    response = table.get_item(Key={"userId": user["id"]})
    item = response.get("Item")
    if not item:
        # Auto-create if not exists
        item = {
            "userId": user["id"],
            "email": user["email"],
            "name": "",
            "subjects": [],
            "availability": []
        }
        table.put_item(Item=item)
    return {"profile": item}

@router.put("/profile")
def update_user_profile(profile: UserProfileUpdate, user: dict = Depends(get_current_user)):
    table.update_item(
        Key={"userId": user["id"]},
        UpdateExpression="SET #n = :name, subjects = :subs, availability = :avail",
        ExpressionAttributeNames={"#n": "name"},
        ExpressionAttributeValues={
            ":name": profile.name,
            ":subs": profile.subjects,
            ":avail": profile.availability
        }
    )
    return {"message": "Profile updated successfully"}

# Technically this falls under groups, but requested by S3 files
@router.post("/groups/{group_id}/upload-url")
def get_upload_url(
    group_id: str, 
    fileName: str = Query(...), 
    contentType: str = Query(...), 
    user: dict = Depends(get_current_user)
):
    group_req = groups_table.get_item(Key={"groupId": group_id})
    group = group_req.get("Item")
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    if user["id"] not in group.get("members", []):
        raise HTTPException(status_code=403, detail="Must be a member")
        
    url_data = get_upload_presigned_url(group_id, fileName, contentType)
    if not url_data:
        raise HTTPException(status_code=500, detail="Failed to generate S3 url")
        
    return url_data

@router.get("/groups/{group_id}/files")
def get_group_files(group_id: str, user: dict = Depends(get_current_user)):
    group_req = groups_table.get_item(Key={"groupId": group_id})
    group = group_req.get("Item")
    if not group or user["id"] not in group.get("members", []):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    files = list_group_files(group_id)
    for f in files:
        f["downloadUrl"] = get_download_presigned_url(f["key"])
        
    return {"files": files}
