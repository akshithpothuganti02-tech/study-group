import os
import boto3
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

# Initialize SNS client
region = os.environ.get("AWS_REGION", "eu-west-1")
sns_client = boto3.client("sns", region_name=region)

# SNS Topic ARN to publish notifications to
SNS_TOPIC_ARN = os.environ.get("SNS_TOPIC_ARN")

def send_session_notification(member_emails: List[str], session: Dict[str, Any], group_name: str):
    """
    Publish a notification about a new session to an Amazon SNS Topic.
    NOTE: Unlike SES, SNS does not support sending directly to a list of emails without them 
    being subscribed to a topic. Therefore `member_emails` is kept for backwards compatibility 
    but the message is broadcasted to the SNS_TOPIC_ARN.
    """
    if not SNS_TOPIC_ARN:
        print(f"Skipping SNS notification for '{session.get('title')}', SNS_TOPIC_ARN not set.")
        return False

    start_date = session.get("startTime", "Unknown Time")
    
    subject = f"[StudySync] New session scheduled: {session.get('title')}"
    
    # Text Body (Since SNS standard email subscriptions are plaintext)
    body_text = (
        f"A new study session has been scheduled for your group '{group_name}'.\n\n"
        f"Session: {session.get('title')}\n"
        f"Location/Link: {session.get('location', 'TBD')}\n"
        f"Start Time: {start_date}\n\n"
        f"Open StudySync to view full details."
    )
    
    try:
        response = sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject[:100],  # SNS Subject is limited to 100 characters
            Message=body_text
        )
        print(f"SNS notification sent! Message ID: {response['MessageId']}")
        return True
    except Exception as e:
        print(f"Failed to send SNS message: {e}")
        return False

def subscribe_user_to_topic(email: str):
    """
    Subscribes a user's email to the SNS topic so they can receive notifications.
    This triggers an automated confirmation email from AWS to their inbox.
    """
    if not SNS_TOPIC_ARN:
        print("Skipping SNS subscription, SNS_TOPIC_ARN not set.")
        return False
        
    try:
        response = sns_client.subscribe(
            TopicArn=SNS_TOPIC_ARN,
            Protocol='email',
            Endpoint=email
        )
        print(f"Subscribed {email} to SNS! Pending confirmation.")
        return True
    except Exception as e:
        print(f"Failed to subscribe {email} to SNS: {e}")
        return False
