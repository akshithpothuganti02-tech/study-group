# StudySync — Student Study Group Finder & Scheduler

A full-stack cloud-based application that allows students to find, create, and schedule study groups. Built for the Cloud Platform Programming module (MSc Cloud Computing, NCI).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Python 3 + FastAPI |
| Auth | AWS Cognito |
| Database | AWS DynamoDB |
| Storage | AWS S3 |
| Notifications | AWS SNS |
| Hosting | AWS EC2 (Unified Frontend + Backend via Nginx) |
| Custom Package | study-sync-utils-py (PyPI) |

---

## Project Structure

```text
study-group-app/
├── study_sync_utils_py/  # Custom Python package (PyPI)
├── backend_py/           # FastAPI backend
│   ├── api/              # API routes (groups, sessions, users)
│   ├── shared/           # DynamoDB, SES, S3, Auth helpers
│   ├── main.py           # FastAPI application entry point
│   └── requirements.txt  # Python dependencies
├── frontend/             # React application
│   └── src/
│       ├── components/   # Auth, Groups, Sessions, Layout
│       ├── pages/        # Dashboard, BrowseGroups, GroupDetail, Profile
│       ├── context/      # AuthContext
│       └── services/     # API, auth helpers
├── DEPLOYMENT_GUIDE.md   # EC2 deployment instructions
├── deploy_ec2.sh         # Deployment automation script
└── README.md
```

---

## AWS Deployment Guide (No CLI Required)

> **Need extreme click-by-click details?** We have a dedicated [AWS Services Manual Setup Guide](AWS_SERVICES_MANUAL_SETUP.md) breaking down DynamoDB, S3, Cognito, and SNS configurations mapped directly to the Python backend requirements.

### Prerequisites
- AWS Student Account
- Your code pushed to a **private** GitHub repository or copied to your EC2 instance.

---

### Step 1 — DynamoDB Tables

Go to **AWS Console → DynamoDB → Create table** and create three tables:

**Table 1: StudySync-Users**
- Partition key: `userId` (String)
- Settings: On-demand capacity

**Table 2: StudySync-Groups**
- Partition key: `groupId` (String)
- Settings: On-demand capacity

**Table 3: StudySync-Sessions**
- Partition key: `sessionId` (String)
- Settings: On-demand capacity

---

### Step 2 — S3 Bucket

Go to **AWS Console → S3 → Create bucket**:
- Bucket name: `studysync-materials-[your-name]` (must be globally unique)
- Region: same as everything else (e.g., `eu-west-1`)
- Block all public access: ON (files use pre-signed URLs)

Add the following CORS configuration under the bucket's **Permissions → CORS**:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

---

### Step 3 — Cognito User Pool

Go to **AWS Console → Cognito → Create user pool**:
- Sign-in option: Email
- Password policy: Minimum 8 characters
- MFA: Optional (disable for simplicity)
- Self-registration: Enabled
- Required attributes: `email`, `name`
- App client name: `studysync-app`
- App client: No secret

Note down:
- **User Pool ID** (e.g., `eu-west-1_xxxxxxxxx`)
- **App Client ID**

---

### Step 4 — SES Email Verification

Go to **AWS Console → SES → Verified identities → Create identity**:
- Type: Email address
- Enter your email and click the verification link

For sending to other emails (beyond sandbox), request production access or verify individual recipient addresses for testing.

Set the sender email in Lambda environment variables as `SES_SENDER_EMAIL`.

---

### Step 5 — EC2 IAM Role

Go to **IAM → Roles → Create role**:
- Trusted entity: AWS service → EC2
- Attach these policies:
  - `AmazonDynamoDBFullAccess`
  - `AmazonS3FullAccess`
  - `AmazonSNSFullAccess`
- Role name: `StudySyncEC2Role`

---

### Step 6 — Deploy FastAPI Backend to EC2

1. **Launch EC2 Instance:**
   - OS: Ubuntu 24.04 LTS (free-tier eligible t2.micro or t3.micro).
   - In the "Advanced Details" section, attach the `StudySyncEC2Role` IAM Instance Profile.
   - Attach a Key Pair that you have access to.

2. **Configure Security Group:**
   - Allow **SSH (Port 22)** from your IP.
   - Allow **HTTP (Port 80)** from Anywhere (0.0.0.0/0) to serve the Monolithic App via Nginx.

3. **Provide Environment Variables:**
   - Provide `S3_BUCKET`, `AWS_REGION`, and `SNS_TOPIC_ARN` inside your EC2 environment or `.env` file since DynamoDB/Cognito utilize IAM roles directly.

4. **Follow `DEPLOYMENT_GUIDE.md`**:
   - We have provided a comprehensive `DEPLOYMENT_GUIDE.md` complete with an automated script (`deploy_ec2.sh`) to effortlessly set up Python, install your utility script package via wheel, and launch FastAPI securely to the background as a `systemd` process.

Your full application will be running natively at `http://<YOUR_EC2_IP>`. No port numbers needed! Nginx will serve the React UI and route specific data routes (`/users`, `/groups`, `/sessions`) seamlessly securely to the background Python API.

---

### Step 8 — Configure Frontend

Edit `/etc/environment` on your EC2 instance (before running the deployment script):
```env
SNS_TOPIC_ARN=arn:aws:sns:eu-west-1...
VITE_COGNITO_USER_POOL_ID=eu-west-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxx
VITE_API_URL=""
```
*(Setting `VITE_API_URL` to empty makes it correctly route to itself through Nginx!)*

---

### Step 9 — Run the Automated Deployment Script

SSH into your EC2 Instance, navigate to your code, and run:
```bash
chmod +x deploy_ec2.sh
sudo ./deploy_ec2.sh
```

Nginx will serve your application live at `http://<YOUR_EC2_IP>`!

---

### Step 10 — Publish the Custom Python Package

```bash
cd study_sync_utils_py
python3 -m build
twine upload dist/*
```

The package will be available securely in PyPI (or TestPyPI depending on your target). Alternatively, deploy locally as shown in `DEPLOYMENT_GUIDE.md`.

---

## Testing the Application

1. Open `http://<YOUR_EC2_IP>` in your browser
2. Register with your email
3. Verify your email via the code sent by Cognito
4. Sign in → you should land on the Dashboard
5. Create a study group with at least one subject
6. Browse groups and join another group
7. Schedule a session — email notification will be sent to subscribed users via SNS
8. Upload a study material file to the group

---

## CI/CD Updates

The entire monolithic architecture (frontend and backend) can be updated manually by pulling the latest code onto the EC2 instance, re-running the deployment script, or systematically rebuilding the UI via `npm run build` and restarting the API via `sudo systemctl restart studysync`.

---

## Dependencies

| Package | Purpose |
|---|---|
| boto3 | AWS SDK (DynamoDB, SNS, S3) |
| fastapi / uvicorn | Backend REST framework and Web Server |
| pydantic | Data validation for the backend |
| python-jose | JWT token decoding and validation |
| study_sync_utils_py | Custom scheduling & matching library |
| react + react-router-dom | Frontend SPA framework |
| aws-amplify | Cognito auth |
| axios | HTTP client |
| tailwindcss | UI styling |
