# EC2 Deployment Guide

## Prerequisites on AWS

> **New to AWS Console?** See our detailed [Manual EC2 Provisioning Guide](AWS_EC2_MANUAL_SETUP.md) for step-by-step, click-by-click instructions on creating the IAM Role, Security Group, and EC2 Instance.

1. **Launch an EC2 Instance**: Use **Ubuntu 24.04** (or 22.04) from the AWS Console. A `t2.micro` or `t3.micro` (free tier eligible) is perfect.
2. **Security Group**: Ensure you open the following ports in your instance's Security Group:
   - `Port 22` (SSH) - for you to connect.
   - `Port 8000` (Custom TCP) - to access the FastAPI server.
3. **IAM Role**: Create an IAM Role with `AmazonDynamoDBFullAccess`, `AmazonS3FullAccess`, and `AmazonSNSFullAccess`. Attach this IAM role to your EC2 instance so `boto3` can securely access AWS services without `.env` keys.

---

## Method 1: Using the Bash Script

The `deploy_ec2.sh` script automates system updates, installs Python, creates a virtual environment, and configures a `systemd` service to keep your FastAPI server running 24/7.

1. Transfer your code to the EC2 instance using `scp` or `git clone`.
   ```bash
   scp -i "your-key.pem" -r ./study-group-app ubuntu@<YOUR_EC2_IP>:~/study-group-app
   ```
2. SSH into your EC2 instance:
   ```bash
   ssh -i "your-key.pem" ubuntu@<YOUR_EC2_IP>
   ```
3. Run the deployment script:
   ```bash
   cd study-group-app
   chmod +x deploy_ec2.sh
   sudo ./deploy_ec2.sh
   ```

---

## Method 2: Deploying Manually

If you prefer to understand the steps or fix issues along the way, you can deploy manually:

### 1. Install Dependencies
```bash
sudo apt-get update
sudo apt-get install python3 python3-pip python3-venv
```

### 2. Set Up Virtual Environment
```bash
cd ~/study-group-app
python3 -m venv venv
source venv/bin/activate
```

### 3. Deploy and Install the Utility Library
As per the brief, the library must be treated as a standalone package. We will build it into a distribution file (wheel) and install it into our virtual environment:

```bash
cd ~/study-group-app/study_sync_utils_py
pip install build setuptools wheel
python3 -m build
pip install dist/*.whl
```
*Note: If you are required to publish it to PyPI or TestPyPI, you can use `twine upload dist/*` here.*

### 4. Install Backend Requirements
Move back to the backend directory and install the API requirements:
```bash
cd ~/study-group-app
pip install -r backend_py/requirements.txt
```

### 5. Create a Systemd Service (Background Process)
To ensure the app stays running when you close your SSH terminal, create a service file:

```bash
sudo nano /etc/systemd/system/studysync.service
```
Paste the following (adjusting paths if needed):
```ini
[Unit]
Description=StudySync FastAPI Server
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/study-group-app/backend_py
Environment="PATH=/home/ubuntu/study-group-app/venv/bin"
EnvironmentFile=/etc/environment
ExecStart=/home/ubuntu/study-group-app/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

### 6. Start the Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable studysync
sudo systemctl start studysync
```

### 6. Managing the Server
- **Check Status**: `sudo systemctl status studysync`
- **View Logs**: `sudo journalctl -u studysync -f`
- **Restart (after making code changes)**: `sudo systemctl restart studysync`
