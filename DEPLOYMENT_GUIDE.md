# EC2 Deployment Guide

## Prerequisites on AWS

> **New to AWS Console?** See our detailed [Manual EC2 Provisioning Guide](AWS_EC2_MANUAL_SETUP.md) for step-by-step, click-by-click instructions on creating the IAM Role, Security Group, and EC2 Instance.

1. **Launch an EC2 Instance**: Use **Ubuntu 24.04** (or 22.04) from the AWS Console. A `t2.micro` or `t3.micro` (free tier eligible) is perfect.
2. **Security Group**: Ensure you open the following ports in your instance's Security Group:
   - `Port 80` (HTTP) - to access the Unified Web Application.
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

Because the application is now a complex monolithic architecture requiring Python 3 (FastAPI), Node.js (Vite/React Build), and Nginx reverse proxy routing, deploying manually step-by-step is no longer recommended. 

If you prefer to understand the system or fix issues along the way, simply open `deploy_ec2.sh` in a text editor to view the systematic terminal commands which execute:
1. Python dependencies and local pip utility packaging.
2. Backgrounding the API onto `127.0.0.1:8000` with Systemd.
3. Nodejs installation and embedding `/etc/environment` using Vite.
4. Nginx configuration mapping `/api` to the backend and `/` to the React files.
