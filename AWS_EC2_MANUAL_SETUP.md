# Creating the AWS EC2 Environment Manually (Console Guide)

This guide provides a detailed, step-by-step walkthrough for manually creating the IAM Role, Security Group, and EC2 instance required to host the StudySync Python backend on AWS. 

---

## Step 1 — Create the EC2 IAM Role

An IAM role allows your EC2 server to securely access DynamoDB, S3, and SNS without you needing to hardcode sensitive AWS access keys in your code.

1. Log into your **AWS Management Console**.
2. Search for **IAM** in the top search bar and open the IAM dashboard.
3. In the left navigation pane, click **Roles**, then click the **Create role** button.
4. **Select trusted entity**:
   * Trusted entity type: **AWS service**
   * Use case: **EC2** (Select EC2 from the dropdown or radio button).
   * Click **Next**.
5. **Add permissions**: Search for and tick the checkboxes next to the following three managed policies:
   * `AmazonDynamoDBFullAccess`
   * `AmazonS3FullAccess`
   * `AmazonSNSFullAccess`
   * *(Note: In a strict production environment, you would use custom policies with least-privilege, but these are sufficient for your project).*
6. Click **Next**.
7. **Name, review, and create**:
   * Role name: `StudySyncEC2Role`
   * Description: "Allows EC2 to access DynamoDB, S3, and SNS for the StudySync Backend."
   * Click **Create role**.

---

## Step 2 — Create the EC2 Security Group

A Security Group acts as a virtual firewall for your EC2 instance, controlling incoming and outgoing traffic.

1. Search for **EC2** in the top search bar and open the EC2 dashboard.
2. In the left navigation pane, scroll down to **Network & Security** and click **Security Groups**.
3. Click the **Create security group** button.
4. **Basic details**:
   * Security group name: `StudySync-SG`
   * Description: "Allow SSH and Port 8000 for FastAPI"
   * VPC: Keep the default VPC selected.
5. **Inbound rules** (Click **Add rule** for each):
   * **Rule 1 (SSH)**:
     * Type: `SSH`
     * Port range: `22`
     * Source: `Anywhere-IPv4` (0.0.0.0/0) — *Alternatively, select `My IP` for better security so only you can SSH.*
   * **Rule 2 (Backend API)**:
     * Type: `Custom TCP`
     * Port range: `8000`
     * Source: `Anywhere-IPv4` (0.0.0.0/0)
6. **Outbound rules**: Leave the default (All traffic / All ports / Destination 0.0.0.0/0).
7. Click **Create security group**.

---

## Step 3 — Launch the EC2 Instance

Now, we will launch the actual virtual server and attach the IAM Role and Security Group to it.

1. On the EC2 dashboard, click **Instances** in the left sidebar.
2. Click the orange **Launch instances** button in the top right.
3. **Name and tags**:
   * Name: `StudySync-Backend-Server`
4. **Application and OS Images (Amazon Machine Image)**:
   * Select **Ubuntu** from the Quick Start list.
   * Version: Ensure **Ubuntu Server 24.04 LTS (HVM)** or **22.04 LTS** is selected (ensure "Free tier eligible" is labelled below it).
5. **Instance type**:
   * Select **t2.micro** or **t3.micro** (depending on the region, one will be free-tier eligible).
6. **Key pair (login)**:
   * Click **Create new key pair** if you don't already have one.
   * Key pair name: `studysync-key`
   * Key pair type: **RSA**
   * Private key file format: **.pem** (for Mac/Linux/Windows 10+) or **.ppk** (if you use older PuTTY).
   * Click **Create key pair**. *(This downloads a file to your computer—keep it safe, you need it to connect to your server!)*
7. **Network settings**:
   * Click the **Edit** button in the corner of this section.
   * Firewall (security groups): Choose **Select existing security group**.
   * Open the dropdown and select the `StudySync-SG` you created in Step 2.
8. **Configure storage**:
   * Change it to **1x 8 GiB gp3** or leave as default. 8 GB is plenty for this API.
9. **Advanced details** (Important!):
   * Scroll down and expand this accordion.
   * **IAM instance profile**: Open the dropdown and select `StudySyncEC2Role` (created in Step 1).
10. Click the **Launch instance** button on the right side.

---

## Step 4 — Connect to Your Instance

1. Once the "Launch Status" says Success, click the Instance ID link (e.g., `i-0abcdef123...`) to view your server.
2. Wait for the **Instance state** to become `Running`.
3. Select your instance and click the **Connect** button at the top.
4. Copy the ssh command under the **SSH client** tab. It will look like this:
   ```bash
   ssh -i "studysync-key.pem" ubuntu@ec2-12-34-56-78.eu-west-1.compute.amazonaws.com
   ```
5. Open a terminal on your local computer, navigate to where your `.pem` key was downloaded, and ensure its permissions are restricted before connecting:
   * **Mac/Linux**: `chmod 400 studysync-key.pem`
6. Run the SSH command. Type `yes` when prompted about the host authenticity.

You are now inside your AWS EC2 server! From here, you can proceed with the backend setup instructions found in `DEPLOYMENT_GUIDE.md`.
