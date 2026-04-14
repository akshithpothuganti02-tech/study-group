from fastapi import APIRouter, Depends
from pydantic import BaseModel
from backend_py.shared.dynamodb import dynamodb, TABLES
from backend_py.shared.auth import get_current_user
from backend_py.shared.sns import subscribe_user_to_topic

router = APIRouter(prefix="/users", tags=["Users"])
table = dynamodb.Table(TABLES["USERS"])

class UserProfileUpdate(BaseModel):
    name: str
    subjects: list[str]
    availability: list[str]

@router.get("/profile")
def get_user_profile(user: dict = Depends(get_current_user)):
    response = table.get_item(Key={"userId": user["id"]})
    item = response.get("Item")
    if not item:
        # Auto-create profile on first login
        item = {
            "userId": user["id"],
            "email": user["email"],
            "name": "",
            "subjects": [],
            "availability": []
        }
        table.put_item(Item=item)
        
        # Auto-subscribe to SNS Topic since this is their first time logging in
        subscribe_user_to_topic(user["email"])
        
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
