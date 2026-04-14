import os
import boto3
from dotenv import load_dotenv

load_dotenv()

# Initialize DynamoDB client
region = os.environ.get("AWS_REGION", "eu-west-1")

dynamodb = boto3.resource(
    "dynamodb",
    region_name=region
)

# Table name constants
TABLES = {
    "USERS": os.environ.get("USERS_TABLE", "StudySync-Users"),
    "GROUPS": os.environ.get("GROUPS_TABLE", "StudySync-Groups"),
    "SESSIONS": os.environ.get("SESSIONS_TABLE", "StudySync-Sessions")
}
