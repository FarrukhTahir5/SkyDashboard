# Deployment Guide - SkyDashboard

This guide explains how to host SkyDashboard for free and keep it synchronized with your Jira data.

## 1. GitHub Setup 🚀

1.  **Initialize Git**: 
    If you haven't already, run these in the root folder:
    ```bash
    git init
    git add .
    git commit -m "Initial commit for SkyDashboard"
    ```
2.  **Create Repository**: Create a private repository on GitHub named `SkyDashboard`.
3.  **Push**:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/SkyDashboard.git
    git branch -M main
    git push -u origin main
    ```
    *(Note: Your `.env` and `scripts/tests` are excluded by the global `.gitignore` to keep secrets safe.)*

## 2. Backend Deployment (FastAPI) 🐍

We recommend **Render** or **Railway** for free Python hosting.

### Render Steps:
1.  Connect your GitHub repository.
2.  Select **Web Service**.
3.  Set **Runtime** to `Python 3`.
4.  Set **Build Command**: `pip install -r backend/requirements.txt`.
5.  Set **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`.
6.  **Environment Variables**: Add these in the Render dashboard:
    - `JIRA_DOMAIN`: (e.g., yourcompany.atlassian.net)
    - `JIRA_EMAIL`: (Your Jira email)
    - `JIRA_API_TOKEN`: (Your Jira API Token)
    - `ENVIRONMENT`: `production`
    - `FRONTEND_URL`: (Your Vercel URL - add this AFTER the frontend is deployed)

## 4. Self-Hosting on a Linux Server 🖥️
If you are deploying on your own server instead of a cloud provider, follow these manual steps. **Docker is not required.**

### Backend (FastAPI)
1.  **Environment**: Ensure Python 3.10+ is installed.
2.  **Dependencies**: 
    ```bash
    cd backend
    pip install -r requirements.txt
    ```
3.  **Run**: Use `pm2` or a systemd service to keep the process alive.
    ```bash
    uvicorn main:app --host 0.0.0.0 --port 8000
    ```

### Frontend (Nginx)
1.  **Build**:
    ```bash
    cd frontend
    npm install
    VITE_API_URL=http://your-server-ip:8000 npm run build
    ```
2.  **Serve**: Move the `dist` folder to your web server root (e.g., `/var/www/html`) and configure Nginx:
    ```nginx
    server {
        listen 80;
        location / {
            root /var/www/html/dist;
            try_files $uri $uri/ /index.html;
        }
    }
    ```

## 5. Maintenance & Security 🛡️
- **API Token**: Never commit your Jira Token.
- **CORS**: The backend only allows requests from the URL defined in your `FRONTEND_URL` variable.

---
*Built with ❤️ for SkyElectric QA*
