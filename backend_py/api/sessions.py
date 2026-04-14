import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from backend_py.shared.dynamodb import dynamodb, TABLES
from backend_py.shared.auth import get_current_user
from backend_py.shared.sns import send_session_notification

router = APIRouter(prefix="/sessions", tags=["Sessions"])
table = dynamodb.Table(TABLES["SESSIONS"])
groups_table = dynamodb.Table(TABLES["GROUPS"])

class SessionCreate(BaseModel):
    groupId: str
    title: str
    startTime: str
    endTime: str
    location: Optional[str] = ""

@router.post("")
def create_session(session: SessionCreate, user: dict = Depends(get_current_user)):
    group_response = groups_table.get_item(Key={"groupId": session.groupId})
    group = group_response.get("Item")
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    if user["id"] not in group.get("members", []):
        raise HTTPException(status_code=403, detail="Must be a group member to create session")
        
    session_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat() + "Z"
    
    new_session = {
        "sessionId": session_id,
        "groupId": session.groupId,
        "title": session.title,
        "startTime": session.startTime,
        "endTime": session.endTime,
        "location": session.location,
        "creatorId": user["id"],
        "participants": group.get("members", []),
        "createdAt": now
    }
    
    table.put_item(Item=new_session)
    
    # Send email notifications to group members
    send_session_notification(
        member_emails=group.get("memberEmails", []), 
        session=new_session, 
        group_name=group.get("name", "Study Group")
    )
    
    return {"message": "Session created", "session": new_session}

@router.get("")
def get_sessions():
    response = table.scan()
    return {"sessions": response.get("Items", [])}

@router.delete("/{session_id}")
def delete_session(session_id: str, user: dict = Depends(get_current_user)):
    response = table.get_item(Key={"sessionId": session_id})
    session = response.get("Item")
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session.get("creatorId") != user["id"]:
        raise HTTPException(status_code=403, detail="Only the creator can delete this session")
        
    table.delete_item(Key={"sessionId": session_id})
    return {"message": "Session deleted"}

class SlotSuggestionRequest(BaseModel):
    date: str

@router.post("/suggest-slots")
def suggest_time_slots(req: SlotSuggestionRequest, user: dict = Depends(get_current_user)):
    from study_sync_utils_py.time_slot_generator import TimeSlotGenerator
    
    # 1. Fetch existing sessions to determine booked slots
    response = table.scan()
    all_sessions = response.get("Items", [])
    
    # Simple Python native filter to isolate the requested day
    booked = [s for s in all_sessions if req.date in s.get("startTime", "")]
    
    # 2. Use utility library to safely generate open slots
    generator = TimeSlotGenerator(60, 8, 22)
    slots = generator.get_available_slots(req.date, booked)
    
    return {"slots": slots[:8]} # Return top 8 available slots
