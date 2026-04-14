#!/bin/bash
# deploy_ec2.sh
# Run this script with sudo (e.g., sudo ./deploy_ec2.sh) on your Ubuntu EC2 instance

# Exit immediately if a command exits with a non-zero status
set -e

echo "Updating system packages..."
apt-get update && apt-get upgrade -y

echo "Installing Python 3, pip, and virtual environment dependencies..."
apt-get install -y python3 python3-pip python3-venv

APP_DIR="/opt/study-group-app"
USER="ubuntu"  # Default user for Ubuntu EC2

echo "Setting up application directory at $APP_DIR..."
# Create directory if it doesn't exist
mkdir -p $APP_DIR
# Change ownership to the ubuntu user so they can copy files easily
chown -R $USER:$USER $APP_DIR

# (Assuming you have copied your study-group-app files into $APP_DIR before running the rest,
#  but if this is run right after cloning, we proceed in the current directory)
CURRENT_DIR=$(pwd)
if [ "$CURRENT_DIR" != "$APP_DIR" ]; then
    echo "Copying files from $CURRENT_DIR to $APP_DIR..."
    cp -r * $APP_DIR/
    chown -R $USER:$USER $APP_DIR
fi

echo "Setting up Python virtual environment..."
cd $APP_DIR
# Create virtual environment
sudo -u $USER python3 -m venv venv

# Activate and install requirements
echo "Installing Python dependencies..."
sudo -u $USER bash -c "source venv/bin/activate && pip install -r backend_py/requirements.txt"

# Build and install study_sync_utils_py formally
echo "Installing the local library as a formal pip package..."
cd $APP_DIR/study_sync_utils_py
sudo -u $USER bash -c "source ../venv/bin/activate && pip install build && python3 -m build"
sudo -u $USER bash -c "source ../venv/bin/activate && pip install dist/*.whl"

echo "Creating Systemd service for FastAPI (Uvicorn)..."
SERVICE_FILE="/etc/systemd/system/studysync.service"

cat <<EOF > $SERVICE_FILE
[Unit]
Description=StudySync FastAPI application
After=network.target

[Service]
User=$USER
Group=www-data
WorkingDirectory=$APP_DIR/backend_py
Environment="PATH=$APP_DIR/venv/bin"
EnvironmentFile=/etc/environment
# Library is installed via pip now, so we don't strictly need PYTHONPATH
ExecStart=$APP_DIR/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

echo "Reloading systemd, enabling and starting the service..."
systemctl daemon-reload
systemctl enable studysync
systemctl start studysync

echo "Checking service status briefly..."
sleep 2
systemctl status studysync --no-pager | head -n 10

echo "Deployment complete! Your API should be accessible at http://<YOUR_EC2_PUBLIC_IP>:8000"
echo "Note: Ensure port 8000 is open in your EC2 Security Group."
