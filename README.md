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
| Email | AWS SES |
| Hosting | AWS EC2 (Backend) / AWS Amplify (Frontend) |
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

### Prerequisites
- AWS Student Account
- GitHub account (for Amplify CI/CD)
- Your code pushed to a **private** GitHub repository

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
  - `AmazonSESFullAccess`
- Role name: `StudySyncEC2Role`

---

### Step 6 — Deploy FastAPI Backend to EC2

1. **Launch EC2 Instance:**
   - OS: Ubuntu 24.04 LTS (free-tier eligible t2.micro or t3.micro).
   - In the "Advanced Details" section, attach the `StudySyncEC2Role` IAM Instance Profile.
   - Attach a Key Pair that you have access to.

2. **Configure Security Group:**
   - Allow **SSH (Port 22)** from your IP.
   - Allow **Custom TCP (Port 8000)** from Anywhere (0.0.0.0/0).

3. **Provide Environment Variables:**
   - Provide `S3_BUCKET`, `AWS_REGION`, and `SES_SENDER_EMAIL` inside your EC2 environment or `.env` file since DynamoDB/Cognito utilize IAM roles directly.

4. **Follow `DEPLOYMENT_GUIDE.md`**:
   - We have provided a comprehensive `DEPLOYMENT_GUIDE.md` complete with an automated script (`deploy_ec2.sh`) to effortlessly set up Python, install your utility script package via wheel, and launch FastAPI securely to the background as a `systemd` process.

Your API will be running at `http://<YOUR_EC2_IP>:8000`. Keep this URL handy for the frontend environment setup.

---

### Step 8 — Configure Frontend

Edit `frontend/src/aws-exports.js`:
```js
const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'eu-west-1_xxxxxxxxx',   // your User Pool ID
      userPoolClientId: 'xxxxxxxxxxxx',      // your App Client ID
      ...
    },
  },
};
```

Edit `frontend/src/.env` (create this file):
```
VITE_API_URL=http://<YOUR_EC2_IP>:8000
```

---

### Step 9 — Deploy Frontend via AWS Amplify

1. Push your code to a **private** GitHub repository
2. Go to **AWS Amplify → New app → Host web app**
3. Connect to GitHub → select your repo → select branch `main`
4. Build settings will auto-detect Vite. Confirm build commands:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Root directory: `frontend`
5. Add environment variables:
   - `VITE_API_URL` = `http://<YOUR_EC2_IP>:8000`
6. Click **Save and deploy**

Amplify will give you a public URL like `https://main.xxxx.amplifyapp.com`

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

1. Open the Amplify URL
2. Register with your email
3. Verify your email via the code sent by Cognito
4. Sign in → you should land on the Dashboard
5. Create a study group with at least one subject
6. Browse groups and join another group
7. Schedule a session — email notification will be sent via SES
8. Upload a study material file to the group

---

## CI/CD

AWS Amplify provides automatic CI/CD — every `git push` to the `main` branch triggers a new build and deployment. The build history and logs are visible in the Amplify Console.

The backend (EC2) can be updated manually by pulling the latest code onto the EC2 instance and restarting the systemd server: `git pull && sudo systemctl restart studysync`.

---

## Dependencies

| Package | Purpose |
|---|---|
| boto3 | AWS SDK (DynamoDB, SES, S3) |
| fastapi / uvicorn | Backend REST framework and Web Server |
| pydantic | Data validation for the backend |
| python-jose | JWT token decoding and validation |
| study_sync_utils_py | Custom scheduling & matching library |
| react + react-router-dom | Frontend SPA framework |
| aws-amplify | Cognito auth |
| axios | HTTP client |
| tailwindcss | UI styling |
