## Major TODOs
- [x] Way to delete items
- [ ] User accounts / authentication
- [ ] "Public" vs "Private" categories / lists
- [x] Deployment
- [ ] Observability and monitoring
- [ ] Code cleanup
- [ ] Documentation
- [ ] Way to delete all items in a category
- [ ] CI / CD


## Development

To easily run both the frontend (Vite) and backend (Rust) locally:

```bash
./dev.sh
```


This script will:
1.  Start the Rust backend on `http://localhost:3000`.
2.  Start the Vite frontend on `http://localhost:5173` (proxying API requests to the backend).

### Connecting to Production

To run the frontend locally but connect to a live backend (e.g. production):

```bash
./dev.sh --target http://YOUR_PROD_IP
```

This will **skip** starting the local Rust server and instead proxy API requests to the specified URL.


## Infrastructure & Deployment

This project is deployed to a Google Cloud Platform (GCP) VM (Ubuntu) using a rigorous shell script.

### 1. Infrastructure Setup

If you need to create a new environment from scratch:

1.  **Run the Setup Guide**:
    We have an interactive script that walks you through creating the VM on GCP.
    ```bash
    ./setup_infra.sh
    ```
    Follow the on-screen instructions to:
    - Create a GCP Project.
    - Provision an **e2-micro** (free tier eligible) Ubuntu VM.
    - Open Firewall ports (HTTP/HTTPS).
    - Reserve a **Static External IP**.
    - Add your local SSH public key (`~/.ssh/id_ed25519.pub` or similar) to the VM.

2.  **Verify Access**:
    Ensure you can SSH into the machine:
    ```bash
    ssh -i ~/.ssh/id_ed25519 <VM_USERNAME>@<VM_IP>
    ```

### 2. Configuration

Before deploying, you must check the configuration variables at the top of `deploy.sh`.

```bash
# deploy.sh
VM_USER="your-gcp-username"  # The username from your SSH key setup
VM_IP="34.123.456.78"        # The Static IP you reserved
SSH_KEY="~/.ssh/id_ed25519"  # Path to your private SSH key
```

### 3. Deployment

To deploy the latest code (both Frontend and Backend):

```bash
./deploy.sh
```

**What this script does:**
1.  **Builds Frontend**: Runs `npm run build` in `client/` to generate `dist/`.
2.  **Builds Backend**: Uses Docker to cross-compile the Rust server for Linux (amd64) from your local machine (even if on macOS).
3.  **Uploads**: SCPS the frontend method, backend binary, and config files (systemd, nginx) to the VM.
4.  **Configures**:
    - Moves systemd service files to `/etc/systemd/system/`.
    - Installs/Configures Nginx as a reverse proxy.
    - Restarts the application service.

**Partial Deployments:**
To save time, you can skip parts of the build:
```bash
./deploy.sh --skip-frontend
./deploy.sh --skip-backend
./deploy.sh --only-config   # Only updates Nginx/Systemd configs
```

### 4. User Management

There is no public signup page. To create an admin account:

1.  **Generate Password Hash (Local)**:
    Run the included utility locally to safely hash your password:
    ```bash
    cd server
    cargo run --bin hash_password "YOUR_SECURE_PASSWORD"
    # Output example: $argon2id$v=19$m=19456,t=2,p=1$...
    ```

2.  **Insert User (Remote)**:
    SSH into the VM and insert the user manually:
    ```bash
    ssh -i ~/.ssh/id_ed25519 <VM_USER>@<VM_IP>
    sqlite3 app/data.db "INSERT INTO users (username, password_hash) VALUES ('admin', 'YOUR_HASH_STRING');"
    ```

### 5. Technical Debt / Cleanup

Things to be aware of or refactor in the future:

*   **Config Magic in `deploy.sh`**:
    The `nginx.conf` and `server/stuff-tracker.service` files in the repo contain hardcoded paths like `/home/ubuntu/app`.
    The `deploy.sh` script currently uses `sed` to dynamically replace these with your actual `VM_USER` path during deployment.
    *Cleanup Idea*: Use environment variables or `envsubst` properly in these config files instead of regex replacement.
*   **Database Backups**:
    Currently, the SQLite database lives at `app/data.db`. There is no automated backup strategy.
    *Cleanup Idea*: Add a cron job to backup `data.db` to GCS bucket.