# StudySync — Student Study Group Finder & Scheduler

A full-stack cloud-based application that allows students to find, create, and schedule study groups. Built for the Cloud Platform Programming module (MSc Cloud Computing, NCI).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js (AWS Lambda functions) |
| API | AWS API Gateway (REST) |
| Auth | AWS Cognito |
| Database | AWS DynamoDB |
| Storage | AWS S3 |
| Email | AWS SES |
| Hosting | AWS Amplify |
| Custom Package | study-sync-utils (npm) |

---

## Project Structure

```
study-group-app/
├── study-sync-utils/     # Custom npm package
├── backend/              # Lambda function handlers
│   ├── shared/           # DynamoDB, SES, S3 helpers
│   ├── groups/           # Group CRUD + join/leave
│   ├── sessions/         # Session CRUD
│   └── users/            # Profile + file upload
├── frontend/             # React application
│   └── src/
│       ├── components/   # Auth, Groups, Sessions, Layout
│       ├── pages/        # Dashboard, BrowseGroups, GroupDetail, Profile
│       ├── context/      # AuthContext
│       └── services/     # API, auth helpers
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

### Step 5 — Lambda IAM Role

Go to **IAM → Roles → Create role**:
- Trusted entity: AWS service → Lambda
- Attach these policies:
  - `AmazonDynamoDBFullAccess`
  - `AmazonS3FullAccess`
  - `AmazonSESFullAccess`
  - `CloudWatchLogsFullAccess`
- Role name: `StudySyncLambdaRole`

---

### Step 6 — Deploy Lambda Functions

For each function, go to **Lambda → Create function**:
- Author from scratch
- Runtime: Node.js 20.x
- Execution role: `StudySyncLambdaRole`

**Functions to create:**

| Function Name | File | Handler |
|---|---|---|
| studysync-createGroup | groups/createGroup.js | createGroup.handler |
| studysync-getGroups | groups/getGroups.js | getGroups.handler |
| studysync-getGroupById | groups/getGroupById.js | getGroupById.handler |
| studysync-updateGroup | groups/updateGroup.js | updateGroup.handler |
| studysync-deleteGroup | groups/deleteGroup.js | deleteGroup.handler |
| studysync-joinGroup | groups/joinGroup.js | joinGroup.handler |
| studysync-leaveGroup | groups/leaveGroup.js | leaveGroup.handler |
| studysync-createSession | sessions/createSession.js | createSession.handler |
| studysync-getSessions | sessions/getSessions.js | getSessions.handler |
| studysync-updateSession | sessions/updateSession.js | updateSession.handler |
| studysync-deleteSession | sessions/deleteSession.js | deleteSession.handler |
| studysync-getUserProfile | users/getUserProfile.js | getUserProfile.handler |
| studysync-updateUserProfile | users/updateUserProfile.js | updateUserProfile.handler |
| studysync-getUploadUrl | users/getUploadUrl.js | getUploadUrl.handler |

**For each function:**
1. Upload a ZIP file containing the function file + node_modules (`backend/` folder contents)
2. Set **Environment Variables**:
   - `USERS_TABLE` = `StudySync-Users`
   - `GROUPS_TABLE` = `StudySync-Groups`
   - `SESSIONS_TABLE` = `StudySync-Sessions`
   - `S3_BUCKET` = your bucket name
   - `SES_SENDER_EMAIL` = your verified SES email
   - `AWS_REGION` = `eu-west-1`

To create the ZIP: in the `backend/` folder, run `npm install` then zip the entire folder.

---

### Step 7 — API Gateway

Go to **API Gateway → Create API → REST API**:
- Name: `StudySync-API`
- Endpoint type: Regional

**Add a Cognito Authorizer:**
- Authorizers → Create authorizer
- Type: Cognito
- User pool: your pool
- Token source: `Authorization`
- Name: `CognitoAuth`

**Create resources and methods** (attach corresponding Lambda + Authorizer to each):

```
/groups
  GET  → studysync-getGroups
  POST → studysync-createGroup

/groups/{groupId}
  GET    → studysync-getGroupById
  PUT    → studysync-updateGroup
  DELETE → studysync-deleteGroup

/groups/{groupId}/join
  POST → studysync-joinGroup

/groups/{groupId}/leave
  POST → studysync-leaveGroup

/groups/{groupId}/sessions
  GET  → studysync-getSessions
  POST → studysync-createSession

/groups/{groupId}/upload-url
  POST → studysync-getUploadUrl

/groups/{groupId}/files
  GET  → studysync-getUploadUrl

/sessions/{sessionId}
  PUT    → studysync-updateSession
  DELETE → studysync-deleteSession

/users/profile
  GET → studysync-getUserProfile
  PUT → studysync-updateUserProfile
```

**Enable CORS** on each resource (Actions → Enable CORS).

**Deploy API:**
- Actions → Deploy API
- Stage: `prod`
- Note the **Invoke URL** (e.g., `https://abc123.execute-api.eu-west-1.amazonaws.com/prod`)

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
VITE_API_URL=https://abc123.execute-api.eu-west-1.amazonaws.com/prod
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
   - `VITE_API_URL` = your API Gateway URL
6. Click **Save and deploy**

Amplify will give you a public URL like `https://main.xxxx.amplifyapp.com`

---

### Step 10 — Publish the Custom npm Package

```bash
cd study-sync-utils
npm login
npm publish --access public
```

The package will be available at: `https://www.npmjs.com/package/study-sync-utils`

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

The backend (Lambda) can be updated by re-uploading the ZIP file through the Lambda Console.

---

## Dependencies

| Package | Purpose |
|---|---|
| @aws-sdk/client-dynamodb | DynamoDB operations |
| @aws-sdk/lib-dynamodb | Simplified DynamoDB Document client |
| @aws-sdk/client-ses | Email notifications |
| @aws-sdk/client-s3 | File storage |
| @aws-sdk/s3-request-presigner | Pre-signed upload/download URLs |
| uuid | Unique ID generation |
| study-sync-utils | Custom scheduling & matching library |
| react + react-router-dom | Frontend SPA framework |
| aws-amplify | Cognito auth + S3 integration |
| axios | HTTP client |
| tailwindcss | UI styling |
