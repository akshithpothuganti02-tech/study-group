import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from backend_py.shared.dynamodb import dynamodb, TABLES
from backend_py.shared.auth import get_current_user
from boto3.dynamodb.conditions import Key

router = APIRouter(prefix="/groups", tags=["Groups"])

table = dynamodb.Table(TABLES["GROUPS"])

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    subject: Optional[str] = None
    subjects: Optional[List[str]] = []
    maxSize: Optional[int] = 10
    preferredTimes: Optional[List[str]] = []
    isPublic: Optional[bool] = True

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

from study_sync_utils_py.group_matcher import GroupMatcher

@router.get("")
def get_groups():
    # Naive scan for demo purposes, identical to JS version logic usually
    response = table.scan()
    return {"groups": response.get("Items", [])}

@router.get("/ranked")
def get_ranked_groups(user: dict = Depends(get_current_user)):
    # 1. Fetch user profile
    users_table = dynamodb.Table(TABLES["USERS"])
    user_resp = users_table.get_item(Key={"userId": user["id"]})
    user_profile = user_resp.get("Item", {})
    
    if not user_profile.get("subjects"):
        return {"ranked_groups": []}

    # 2. Fetch all groups
    groups_resp = table.scan()
    all_groups = groups_resp.get("Items", [])

    # 3. Use utility library to dynamically rank groups based on subjects
    matcher = GroupMatcher(all_groups)
    ranked = matcher.find_best_matches(user_profile, top_n=50)

    return {"ranked_groups": ranked}

@router.get("/{group_id}")
def get_group_by_id(group_id: str):
    response = table.get_item(Key={"groupId": group_id})
    item = response.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Group not found")
    return {"group": item}

@router.post("/{group_id}/join")
def join_group(group_id: str, user: dict = Depends(get_current_user)):
    user_id = user["id"]
    response = table.get_item(Key={"groupId": group_id})
    item = response.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Group not found")
        
    members = item.get("members", [])
    if user_id in members:
        return {"message": "Already a member"}
        
    if len(members) >= item.get("maxSize", 10):
        raise HTTPException(status_code=400, detail="Group is full")
        
    members.append(user_id)
    member_emails = item.get("memberEmails", [])
    if user["email"] not in member_emails:
        member_emails.append(user["email"])
        
    table.update_item(
        Key={"groupId": group_id},
        UpdateExpression="SET members = :m, memberEmails = :me",
        ExpressionAttributeValues={":m": members, ":me": member_emails}
    )
    return {"message": "Joined group successfully"}
