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

## 3. Frontend Deployment (React + Vite) ⚛️

We recommend **Vercel** for the fastest React hosting.

### Vercel Steps:
1.  Connect your GitHub repository.
2.  Vercel will detect it as a Vite project.
3.  **Root Directory**: Set this to `frontend`.
4.  **Environment Variables**:
    - `VITE_API_URL`: (The URL of your deployed Render backend)
5.  Click **Deploy**.

## 4. Maintenance & Security 🛡️

- **API Token**: Never commit your Jira Token. If you accidentally expose it, regenerate it immediately at [Atlassian Security](https://id.atlassian.com/manage-profile/security/api-tokens).
- **CORS**: The backend only allows requests from the URL defined in your `FRONTEND_URL` variable.

---
*Built with ❤️ for SkyElectric QA*
