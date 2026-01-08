# Quick Start Guide - Jira Dashboard

## Prerequisites
- Docker and Docker Compose installed
- Jira credentials (domain, email, API token)

## Setup Steps

### 1. Environment Configuration
Make sure your `backend/.env` file has:
```env
JIRA_DOMAIN=skyelectric.atlassian.net
JIRA_EMAIL=your-email@skyelectric.com
JIRA_API_TOKEN=your-api-token
```

### 2. Start the Services

```bash
# From the SkyDashboard directory
cd /home/farrukhtahir/Skyelectric/SkyDashboard

# Start both backend and frontend
docker compose up -d

# Or start them separately:
docker compose up -d backend
docker compose up -d frontend
```

### 3. Verify Services are Running

```bash
# Check status
docker compose ps

# Should show:
# skydashboard-backend   running   0.0.0.0:8000->8000/tcp
# skydashboard-frontend  running   0.0.0.0:5173->5173/tcp
```

### 4. Access the Dashboard

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 5. Test New Endpoints

```bash
# Test project ID lookup
curl http://localhost:8000/api/project/HVP/id

# Test boards by project ID
curl http://localhost:8000/api/project/10112/boards

# Test recent bugs
curl "http://localhost:8000/api/bugs/recent?project_id=10112&days=30"
```

## Troubleshooting

### Backend not starting
```bash
# View logs
docker compose logs backend

# Restart backend
docker compose restart backend
```

### Frontend not starting
```bash
# View logs
docker compose logs frontend

# Restart frontend
docker compose restart frontend
```

### Docker daemon not running
```bash
# Start Docker daemon (Ubuntu/Debian)
sudo systemctl start docker

# Or on other systems
sudo service docker start
```

## Using the Bug Reporting Widget

1. **Select a Project** - Use the project dropdown
2. **Widget will auto-load** - Shows bugs from last 30 days
3. **Change time period** - Select 15, 30, or 60 days
4. **Filter by board** - Optional board selection
5. **Click on bugs** - Opens Jira issue in new tab

## Development Mode

### Backend (with hot reload)
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (with hot reload)
```bash
cd frontend
npm run dev
```

## Next Steps

To add the bug widget to your dashboard:

1. Open `frontend/src/App.jsx`
2. Import the widget:
   ```javascript
   import { RecentBugsWidget } from './components/dashboard/RecentBugsWidget';
   ```
3. Add it to your layout:
   ```javascript
   <RecentBugsWidget projectId={projectId} boardId={selectedBoard} />
   ```

That's it! The widget will automatically fetch and display recent bugs.
