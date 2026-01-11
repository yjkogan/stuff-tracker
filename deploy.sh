#!/bin/bash
set -e

# --- CONFIGURATION ---
# REPLACE THESE WITH YOUR ACTUAL VALUES
VM_USER="yjkogan"        # The username shown in GCP SSH keys setup
VM_IP="34.187.250.194"       # The External IP of your VM
SSH_KEY="~/.ssh/id_ed25519"       # Path to your private SSH key
APP_DIR="/var/www/stuff-tracker"    # Directory on VM to deploy to
# ---------------------

echo "==================================================="
echo "   Stuff Tracker Deployment Script"
echo "==================================================="

if [ "$VM_IP" == "YOUR_VM_IP_HERE" ]; then
    echo "ERROR: Please edit this script and set VM_IP to your actual VM IP address."
    exit 1
fi

# --- ARGUMENT PARSING ---
SKIP_BUILD=false

for arg in "$@"; do
    case $arg in
        --skip-build)
            SKIP_BUILD=true
            ;;
        *)
            echo "Unknown argument: $arg"
            echo "Usage: ./deploy.sh [--skip-build]"
            exit 1
            ;;
    esac
done

echo "Deployment Mode:"
echo "  Skip Build: $SKIP_BUILD"
echo "---------------------------------------------------"


if [ "$SKIP_BUILD" = "false" ]; then
    echo "[1/4] Building Frontend..."
    cd client
    npm ci
    npm run build
    cd ..

    echo "[2/4] Building Backend (using Docker for Linux compat)..."
    # We use a cross-compilation docker image to build a linux-compatible binary on macOS
    # Using rust:latest to ensure support for edition 2024
    docker run --rm --platform linux/amd64 -v "$(pwd)/server":/usr/src/app -w /usr/src/app rust:latest \
        cargo build --release --target-dir ./target-linux

    # The binary will be at server/target-linux/release/server
    if [ ! -f "server/target-linux/release/server" ]; then
        echo "ERROR: Backend binary not found!"
        exit 1
    fi
else
    echo "[1/2] Skipping Build (using existing artifacts)..."
    # Verify artifacts exist
    if [ ! -d "client/dist" ]; then
        echo "ERROR: Frontend build artifacts (client/dist) not found!"
        exit 1
    fi
    if [ ! -f "server/target-linux/release/server" ]; then
        echo "ERROR: Backend binary not found!"
        exit 1
    fi
fi

echo "[3/4] Preparing Remote Directory..."
# Create directory with sudo and set ownership to VM_USER
ssh -i $SSH_KEY $VM_USER@$VM_IP "sudo mkdir -p $APP_DIR && sudo chown $VM_USER $APP_DIR && mkdir -p $APP_DIR/client $APP_DIR/uploads $APP_DIR/build"

echo "[4/4] Uploading Artifacts..."
# Upload Frontend
echo "  -> Frontend..."
scp -i $SSH_KEY -r client/dist/* $VM_USER@$VM_IP:$APP_DIR/client/

echo "  -> Stopping service..."
ssh -i $SSH_KEY $VM_USER@$VM_IP "sudo systemctl stop stuff-tracker || true"

echo "  -> Backend Binary..."
scp -i $SSH_KEY server/target-linux/release/server $VM_USER@$VM_IP:$APP_DIR/server

# Upload Configs
echo "  -> Configs..."
sed "s/User=ubuntu/User=$VM_USER/g" server/stuff-tracker.service > stuff-tracker.service.tmp
scp -i $SSH_KEY stuff-tracker.service.tmp $VM_USER@$VM_IP:/tmp/stuff-tracker.service
rm stuff-tracker.service.tmp
scp -i $SSH_KEY nginx.conf $VM_USER@$VM_IP:/tmp/nginx.conf

echo "[5/4] Configuring Remote Server..."
ssh -i $SSH_KEY $VM_USER@$VM_IP << EOF
    # 1. Setup Backend Service
    sudo mv /tmp/stuff-tracker.service /etc/systemd/system/stuff-tracker.service
    sudo chmod 644 /etc/systemd/system/stuff-tracker.service
    
    # Reload Systemd
    sudo systemctl daemon-reload
    sudo systemctl enable stuff-tracker
    sudo systemctl restart stuff-tracker

    # 2. Setup Nginx
    # (Ensure nginx is installed first - strictly this should be in a setup script but we do it here to be safe)
    if ! command -v nginx &> /dev/null; then
        echo "Installing Nginx..."
        sudo apt-get update && sudo apt-get install -y nginx
    fi

    # Ensure sqlite3 is installed for user management
    if ! command -v sqlite3 &> /dev/null; then
        echo "Installing Sqlite3..."
        sudo apt-get update && sudo apt-get install -y sqlite3
    fi

    sudo mv /tmp/nginx.conf /etc/nginx/sites-available/stuff-tracker
    # Enable site by linking to sites-enabled
    sudo ln -sf /etc/nginx/sites-available/stuff-tracker /etc/nginx/sites-enabled/
    # Remove default nginx site if it exists
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Reload Nginx
    sudo systemctl restart nginx
EOF

echo "==================================================="
echo "   DEPLOYMENT COMPLETE!"
echo "   Access your app at: http://$VM_IP"
echo "==================================================="
