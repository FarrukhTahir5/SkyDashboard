
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from jira_client import JiraClient
from gsheets_client import gsheets

import os
import time
import logging
from functools import wraps

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("SkyDashboard")

app = FastAPI(title="SkyDashboard API v2")

# Configure CORS
allowed_origins = [
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if os.getenv("ENVIRONMENT") == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

jira = JiraClient()

# Simple In-Memory Cache
_cache = {}
CACHE_TTL = int(os.getenv("CACHE_TTL", 300)) # Default 5 minutes

def async_cache(ttl=CACHE_TTL):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{args}:{kwargs}"
            if cache_key in _cache:
                timestamp, result = _cache[cache_key]
                if time.time() - timestamp < ttl:
                    logger.debug(f"Cache hit for {func.__name__}")
                    return result
            
            logger.info(f"Fetching fresh data for {func.__name__}")
            result = await func(*args, **kwargs)
            _cache[cache_key] = (time.time(), result)
            return result
        return wrapper
    return decorator

@app.get("/")
async def root():
    return {"message": "SkyDashboard Backend v2 is running", "version": "2.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": time.time()}

@app.get("/api/projects")
@async_cache(ttl=600)
async def get_projects():
    return await jira.get_projects()

@app.get("/api/boards")
@async_cache(ttl=300)
async def get_boards(project: str):
    return await jira.get_boards(project)

@app.get("/api/sprints")
@async_cache(ttl=120)
async def get_sprints(board_id: int):
    return await jira.get_sprints(board_id)

@app.get("/api/dashboard/progress")
@async_cache(ttl=60)
async def get_dashboard_progress(project: str = "SSSS,JI", sprint_id: int = None):
    return await jira.get_sprint_progress(project, sprint_id)

@app.get("/api/dashboard/phase-status")
@async_cache(ttl=60)
async def get_phase_status(project: str = "SSSS,JI", board_id: int = None, sprint_id: int = None):
    return await jira.get_phase_progress(project, board_id, sprint_id)

@app.get("/api/dashboard/summary")
@async_cache(ttl=60)
async def get_project_summary(project: str = "SSSS,JI"):
    return await jira.get_project_summary(project)

@app.get("/api/dashboard/bugs-by-component")
@async_cache(ttl=60)
async def get_bugs_by_component(project: str = "SSSS,JI", sprint_id: int = None):
    return await jira.get_unresolved_bugs_by_component(project, sprint_id)

@app.get("/api/dashboard/open-issues")
@async_cache(ttl=60)
async def get_open_issues(project: str = "SSSS,JI", sprint_id: int = None):
    return await jira.get_open_issues_pending(project, sprint_id)

@app.get("/api/dashboard/qa-risks")
@async_cache(ttl=60)
async def get_qa_risks(project: str = "SSSS,JI"):
    return await jira.get_qa_risks(project)

# ============================================================================
# NEW DATA FLOW ENDPOINTS: Project ID → Boards → Sprints → Issues
# ============================================================================

@app.get("/api/project/{project_key}/id")
@async_cache(ttl=3600)
async def get_project_id(project_key: str):
    """Get project ID and metadata from project key"""
    return await jira.get_project_id(project_key)

@app.get("/api/project/{project_id}/boards")
@async_cache(ttl=300)
async def get_boards_by_project(project_id: int):
    """Get all boards for a project using project ID"""
    return await jira.get_boards_by_project_id(project_id)

@app.get("/api/board/{board_id}/sprints")
@async_cache(ttl=120)
async def get_board_sprints(board_id: int, state: str = "active,future,closed"):
    """Get sprints for a board with optional state filtering"""
    return await jira.get_sprints_by_board(board_id, state)

@app.get("/api/sprint/{sprint_id}/issues")
@async_cache(ttl=60)
async def get_sprint_issues(sprint_id: int):
    """Get all issues in a specific sprint"""
    return await jira.get_sprint_issues_detailed(sprint_id)

@app.get("/api/issues/recent")
@async_cache(ttl=60)
async def get_recent_issues(project_id: int, days: int = 30, board_id: int = None, issue_type: str = "Bug"):
    """Get issues of a specific type created in the last X days, optionally filtered by board"""
    return await jira.get_recent_issues(project_id, days, board_id, issue_type)

@app.get("/api/bugs/severity-stats")
@async_cache(ttl=60)
async def get_bug_severity_stats(project_id: int, board_id: int = None, days: int = None, unresolved_only: bool = True):
    """Get bug counts grouped by severity (priority) for a project and board"""
    return await jira.get_bug_severity_stats(project_id, board_id, days, unresolved_only)

@app.get("/api/dashboard/developer-stats")
@async_cache(ttl=60)
async def get_developer_stats(project: str = "SSSS,JI", sprint_id: int = None):
    """Get unresolved issues aggregated by developer and status"""
    return await jira.get_developer_stats(project, sprint_id)

@app.get("/api/dashboard/board-quality")
@async_cache(ttl=300)
async def get_board_quality(project_id: int):
    """Get Actual vs Not a Bug stats and Avg Resolution Time per board"""
    return await jira.get_board_quality_stats(project_id)

@app.get("/api/dashboard/bug-flow")
@async_cache(ttl=300)
async def get_bug_flow(project_id: int):
    """Get bug reporting flow (Reporter -> Assignee)"""
    return await jira.get_bug_flow_stats(project_id)

@app.get("/api/dashboard/sheet-progress")
@async_cache(ttl=60)
async def get_sheet_progress():
    """Get progress averages from Google Sheets (Phase 2)"""
    return await gsheets.get_sheet_data()

@app.get("/api/dashboard/sprint-timeline")
@async_cache(ttl=300)
async def get_sprint_timeline(board_ids: str = "50,140"):
    """Get sprint timeline data for specific boards"""
    ids = [int(i.strip()) for i in board_ids.split(",") if i.strip()]
    return await jira.get_sprint_timeline(ids)

@app.get("/api/bugs/epic-stats")
@async_cache(ttl=60)
async def get_bug_epic_stats():
    """Get bug counts and timeline for specific App, Cloud, and PCS epics, including QA timeline from sheets"""
    jira_stats = await jira.get_bug_stats_by_epics()
    qa_timeline = await gsheets.get_qa_timeline()
    
    # Inject sheet data into each squad's breakdown so the frontend can access it easily
    if "breakdown" in jira_stats:
        for cat in jira_stats["breakdown"]:
            jira_stats["breakdown"][cat]["qa_timeline"] = qa_timeline
            
    jira_stats["qa_timeline"] = qa_timeline
    return jira_stats
@app.get("/api/dashboard/test-coverage")
@async_cache(ttl=60)
async def get_test_coverage():
    """Get test coverage status from Google Sheets (Sheet 2)"""
    return await gsheets.get_test_coverage()
