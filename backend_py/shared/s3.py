import os
import boto3
from botocore.exceptions import ClientError
from typing import Dict, Any, List

region = os.environ.get("AWS_REGION", "eu-west-1")
s3_client = boto3.client("s3", region_name=region)

BUCKET_NAME = os.environ.get("S3_BUCKET", "studysync-materials")

def get_upload_presigned_url(group_id: str, file_name: str, content_type: str, expires_in: int = 300) -> Dict[str, str]:
    import time
    file_key = f"groups/{group_id}/{int(time.time() * 1000)}-{file_name}"
    
    try:
        response = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': file_key,
                'ContentType': content_type
            },
            ExpiresIn=expires_in
        )
    except ClientError as e:
        print(e)
        return None
    
    return {"uploadUrl": response, "fileKey": file_key}

def get_download_presigned_url(file_key: str, expires_in: int = 3600) -> str:
    try:
        response = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': file_key
            },
            ExpiresIn=expires_in
        )
    except ClientError as e:
        print(e)
        return None
    return response

def list_group_files(group_id: str) -> List[Dict[str, Any]]:
    try:
        response = s3_client.list_objects_v2(
            Bucket=BUCKET_NAME,
            Prefix=f"groups/{group_id}/"
        )
        contents = response.get('Contents', [])
        return [{
            "key": obj["Key"],
            "size": obj["Size"],
            "lastModified": obj["LastModified"].isoformat(),
            "fileName": obj["Key"].split('/')[-1]
        } for obj in contents]
    except ClientError as e:
        print(e)
        return []

def delete_file(file_key: str):
    try:
        s3_client.delete_object(Bucket=BUCKET_NAME, Key=file_key)
    except ClientError as e:
        print(e)
