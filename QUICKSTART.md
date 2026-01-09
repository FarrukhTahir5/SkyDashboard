# Quick Start Guide - Jira Dashboard

## Prerequisites
- **Python 3.10+** installed
- **Node.js 20+** and **npm** installed
- Jira credentials (domain, email, API token)

## Setup Steps

### 1. Environment Configuration
Create a `.env` file in the `backend/` directory:
```env
JIRA_DOMAIN=skyelectric.atlassian.net
JIRA_EMAIL=your-email@skyelectric.com
JIRA_API_TOKEN=your-api-token
```

### 2. Install Dependencies

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 3. Start the Services (Development Mode)

**Start Backend (Terminal 1):**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Start Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```

### 4. Access the Dashboard
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs


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
