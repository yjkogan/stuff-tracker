#!/bin/bash

# Function to pause and wait for user confirmation
function wait_for_user() {
    echo ""
    read -p "Press [Enter] once you have completed this step..."
    echo "----------------------------------------------------------------"
    echo ""
}

echo "================================================================"
echo "      Stuff Tracker - GCP Infrastructure Setup Guide"
echo "================================================================"
echo "This script will walk you through the manual steps to set up"
echo "your Google Cloud Platform (GCP) environment for deployment."
echo "You will need your web browser open to the GCP Console."
echo "================================================================"
echo ""

echo "STEP 1: Create a Project"
echo "1. Go to https://console.cloud.google.com/"
echo "2. Click the project dropdown in the top bar."
echo "3. Click 'New Project'."
echo "4. Name it 'stuff-tracker' (or similar)."
echo "5. Click 'Create' and wait for it to finish."
echo "6. Select the new project from the dropdown."
wait_for_user

echo "STEP 2: Enable Compute Engine API"
echo "1. In the sidebar, navigate to 'Compute Engine' > 'VM instances'."
echo "2. If prompted, click 'Enable' to enable the Compute Engine API."
echo "3. Wait for it to initialize (this may take a minute)."
wait_for_user

echo "STEP 3: Configure Firewall Rules (HTTP/HTTPS)"
echo "1. Allow standard HTTP/HTTPS traffic."
echo "   (We will do this during VM creation, so just proceed for now.)"
wait_for_user

echo "STEP 4: Create the VM Instance"
echo "1. On the 'VM instances' page, click 'CREATE INSTANCE'."
echo "2. Name: 'stuff-tracker-vm'."
echo "3. Region: Choose 'us-central1' (or a low-cost region near you)."
echo "4. Zone: Any (e.g., 'us-central1-a')."
echo "5. Machine Configuration:"
echo "   - Series: 'E2'"
echo "   - Machine type: 'e2-micro' (2 vCPU, 1 GB memory)."
echo "     *Note: This is often part of the free tier.*"
echo "6. Boot Disk:"
echo "   - Click 'Change'."
echo "   - Operating System: 'Ubuntu'."
echo "   - Version: 'Ubuntu 22.04 LTS' or newer (e.g., 24.04, 25.10)."
echo "   - Size: 10 GB (Standard persistent disk is fine)."
echo "   - Click 'Select'."
echo "7. Firewall:"
echo "   - Check 'Allow HTTP traffic'."
echo "   - Check 'Allow HTTPS traffic'."
wait_for_user

echo "STEP 5: Advanced Networking (Static IP - Optional but Recommended)"
echo "   *Making the IP static ensures it doesn't change on restart.*"
echo "1. Expand 'Advanced options' > 'Networking'."
echo "2. Under 'Network interfaces', click the default interface row."
echo "3. Click 'External IPv4 address' dropdown."
echo "4. Select 'Create IP Address'."
echo "5. Name: 'stuff-tracker-ip'."
echo "6. Click 'Reserve'."
echo "7. Click 'Done' on the network interface card."
wait_for_user

echo "STEP 6: Add SSH Key (Crucial for Deployment Script)"
echo "   *We need to add your public SSH key so the './deploy.sh' script can log in.*"
echo "1. On your LOCAL terminal (open a new tab), run this command to copy your key:"
echo "   cat ~/.ssh/id_rsa.pub | pbcopy"
echo "   (If you don't have one, run 'ssh-keygen -t rsa' first)."
echo "2. Back in GCP Console 'Create an instance' page:"
echo "   - Expand 'Security'."
echo "   - Expand 'Manage access'."
echo "   - Under 'Add manually generated SSH keys', click 'Add item'."
echo "   - Paste your key into the box."
echo "   - IMPORTANT: Note the 'Username' that appears next to the key (e.g., 'yonatankogan')."
echo "     You will need this for the deployment script variable."
wait_for_user

echo "STEP 7: Finalize"
echo "1. Click 'Create' at the bottom of the page."
echo "2. Wait for the VM to be 'RUNNING'."
echo "3. Copy the 'External IP' address shown in the list."
wait_for_user

echo "================================================================"
echo "Setup Complete!"
echo "You now have a VM ready."
echo "Next steps:"
echo "1. Open 'deploy.sh' (I'm creating this next)."
echo "2. Update the 'VM_IP' and 'VM_USER' variables."
echo "3. Run './deploy.sh' to push your code!"
echo "================================================================"
