import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from backend_py.shared.dynamodb import dynamodb, TABLES
from backend_py.shared.auth import get_current_user
from backend_py.shared.s3 import get_upload_presigned_url, get_download_presigned_url, list_group_files
from study_sync_utils_py.group_matcher import GroupMatcher

router = APIRouter(prefix="/groups", tags=["Groups"])

table = dynamodb.Table(TABLES["GROUPS"])
sessions_table = dynamodb.Table(TABLES["SESSIONS"])

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    subject: Optional[str] = None
    subjects: Optional[List[str]] = []
    maxSize: Optional[int] = 10
    preferredTimes: Optional[List[str]] = []
    isPublic: Optional[bool] = True

class UploadUrlRequest(BaseModel):
    fileName: str
    contentType: str

# ─── Create Group ─────────────────────────────────────────────────────────────

@router.post("")
def create_group(group: GroupCreate, user: dict = Depends(get_current_user)):
    if not group.name or not group.name.strip():
        raise HTTPException(status_code=400, detail="Group name is required")
        
    subject_list = group.subjects if group.subjects else ([group.subject] if group.subject else [])
    if not subject_list:
        raise HTTPException(status_code=400, detail="At least one subject is required")

    group_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat() + "Z"

    new_group = {
        "groupId": group_id,
        "name": group.name.strip(),
        "description": group.description,
        "subjects": subject_list,
        "maxSize": group.maxSize,
        "preferredTimes": group.preferredTimes,
        "isPublic": group.isPublic,
        "creatorId": user["id"],
        "creatorEmail": user["email"],
        "members": [user["id"]],
        "memberEmails": [user["email"]],
        "createdAt": now,
        "updatedAt": now
    }

    table.put_item(Item=new_group)
    return {"message": "Group created successfully", "group": new_group}

# ─── List All Groups ──────────────────────────────────────────────────────────

@router.get("")
def get_groups():
    response = table.scan()
    return {"groups": response.get("Items", [])}

# ─── Ranked Groups (via Python Utility Package) ───────────────────────────────

@router.get("/ranked")
def get_ranked_groups(user: dict = Depends(get_current_user)):
    users_table = dynamodb.Table(TABLES["USERS"])
    user_resp = users_table.get_item(Key={"userId": user["id"]})
    user_profile = user_resp.get("Item", {})
    
    if not user_profile.get("subjects"):
        return {"ranked_groups": []}

    groups_resp = table.scan()
    all_groups = groups_resp.get("Items", [])

    matcher = GroupMatcher(all_groups)
    ranked = matcher.find_best_matches(user_profile, top_n=50)
    return {"ranked_groups": ranked}

# ─── Get Single Group ─────────────────────────────────────────────────────────

@router.get("/{group_id}")
def get_group_by_id(group_id: str):
    response = table.get_item(Key={"groupId": group_id})
    item = response.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Group not found")
    return {"group": item}

# ─── Delete Group ─────────────────────────────────────────────────────────────

@router.delete("/{group_id}")
def delete_group(group_id: str, user: dict = Depends(get_current_user)):
    response = table.get_item(Key={"groupId": group_id})
    group = response.get("Item")
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.get("creatorId") != user["id"]:
        raise HTTPException(status_code=403, detail="Only the creator can delete this group")
    table.delete_item(Key={"groupId": group_id})
    return {"message": "Group deleted successfully"}

# ─── Sessions sub-routes ──────────────────────────────────────────────────────

@router.get("/{group_id}/sessions")
def get_group_sessions(group_id: str, user: dict = Depends(get_current_user)):
    """Return all sessions belonging to a specific group, sorted by startTime."""
    response = sessions_table.scan()
    all_sessions = response.get("Items", [])
    group_sessions = [s for s in all_sessions if s.get("groupId") == group_id]
    group_sessions.sort(key=lambda s: s.get("startTime", ""))
    return {"sessions": group_sessions}

@router.post("/{group_id}/sessions")
def create_group_session(group_id: str, session: dict, user: dict = Depends(get_current_user)):
    """Convenience alias — POST a session scoped to the group via URL path."""
    from backend_py.api.sessions import SessionCreate, create_session as _create
    session["groupId"] = group_id
    validated = SessionCreate(**session)
    return _create(validated, user)

# ─── Join / Leave Group ───────────────────────────────────────────────────────

@router.post("/{group_id}/join")
def join_group(group_id: str, user: dict = Depends(get_current_user)):
    response = table.get_item(Key={"groupId": group_id})
    item = response.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Group not found")

    members = item.get("members", [])
    if user["id"] in members:
        return {"message": "Already a member"}
        
    if len(members) >= item.get("maxSize", 10):
        raise HTTPException(status_code=400, detail="Group is full")
        
    members.append(user["id"])
    member_emails = item.get("memberEmails", [])
    if user["email"] not in member_emails:
        member_emails.append(user["email"])
        
    table.update_item(
        Key={"groupId": group_id},
        UpdateExpression="SET members = :m, memberEmails = :me",
        ExpressionAttributeValues={":m": members, ":me": member_emails}
    )
    return {"message": "Joined group successfully"}

@router.post("/{group_id}/leave")
def leave_group(group_id: str, user: dict = Depends(get_current_user)):
    response = table.get_item(Key={"groupId": group_id})
    item = response.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Group not found")

    if item.get("creatorId") == user["id"]:
        raise HTTPException(status_code=400, detail="Creator cannot leave the group. Delete it instead.")

    members = [m for m in item.get("members", []) if m != user["id"]]
    member_emails = [e for e in item.get("memberEmails", []) if e != user["email"]]

    table.update_item(
        Key={"groupId": group_id},
        UpdateExpression="SET members = :m, memberEmails = :me",
        ExpressionAttributeValues={":m": members, ":me": member_emails}
    )
    return {"message": "Left group successfully"}

# ─── S3 File Upload / Download ────────────────────────────────────────────────

@router.post("/{group_id}/upload-url")
def get_upload_url(group_id: str, body: UploadUrlRequest, user: dict = Depends(get_current_user)):
    group_req = table.get_item(Key={"groupId": group_id})
    group = group_req.get("Item")
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if user["id"] not in group.get("members", []):
        raise HTTPException(status_code=403, detail="Must be a member to upload")
        
    url_data = get_upload_presigned_url(group_id, body.fileName, body.contentType)
    if not url_data:
        raise HTTPException(status_code=500, detail="Failed to generate S3 URL")
    return url_data

@router.get("/{group_id}/files")
def get_group_files(group_id: str, user: dict = Depends(get_current_user)):
    group_req = table.get_item(Key={"groupId": group_id})
    group = group_req.get("Item")
    if not group or user["id"] not in group.get("members", []):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    files = list_group_files(group_id)
    for f in files:
        f["downloadUrl"] = get_download_presigned_url(f["key"])
    return {"files": files}
