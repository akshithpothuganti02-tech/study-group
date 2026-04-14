import os
import boto3
from botocore.exceptions import ClientError
from typing import List, Dict, Any

region = os.environ.get("AWS_REGION", "eu-west-1")
ses_client = boto3.client("ses", region_name=region)
SENDER_EMAIL = os.environ.get("SES_SENDER_EMAIL", "noreply@studysync.com")

def send_email(to_addresses: List[str], subject: str, body_text: str, body_html: str = None):
    message = {
        'Subject': {'Data': subject, 'Charset': 'UTF-8'},
        'Body': {
            'Text': {'Data': body_text, 'Charset': 'UTF-8'}
        }
    }
    
    if body_html:
        message['Body']['Html'] = {'Data': body_html, 'Charset': 'UTF-8'}

    try:
        response = ses_client.send_email(
            Source=SENDER_EMAIL,
            Destination={'ToAddresses': to_addresses},
            Message=message
        )
        return response
    except ClientError as e:
        print(e)
        return None

def send_session_notification(member_emails: List[str], session: Dict[str, Any], group_name: str):
    if not member_emails:
        return

    # Basic formatting
    start_date = session.get("startTime", "Unknown Time")
    
    subject = f"[StudySync] New session scheduled: {session.get('title')}"

    body_text = f"""
Hello,

A new study session has been scheduled for your group "{group_name}".

Session: {session.get('title')}
Date & Time: {start_date}
Location/Link: {session.get('location', 'TBD')}

Log in to StudySync to view more details.

StudySync Team
    """.strip()

    app_url = os.environ.get("APP_URL", "#")
    body_html = f"""
<h2>New Study Session Scheduled</h2>
<p>A new study session has been scheduled for your group <strong>{group_name}</strong>.</p>
<table>
  <tr><td><strong>Session:</strong></td><td>{session.get('title')}</td></tr>
  <tr><td><strong>Date & Time:</strong></td><td>{start_date}</td></tr>
  <tr><td><strong>Location/Link:</strong></td><td>{session.get('location', 'TBD')}</td></tr>
</table>
<p><a href="{app_url}">View on StudySync</a></p>
    """

    return send_email(member_emails, subject, body_text, body_html)
