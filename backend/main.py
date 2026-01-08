from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from jira_client import JiraClient

import os

app = FastAPI(title="SkyDashboard API")

# Configure CORS
frontend_url = os.getenv("FRONTEND_URL", "").rstrip("/")
allowed_origins = [
    frontend_url,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
# Filter out empty strings if FRONTEND_URL wasn't set
allowed_origins = [o for o in allowed_origins if o]

is_production = os.getenv("ENVIRONMENT") == "production"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if is_production else ["*"],
    allow_credentials=True if is_production else False, # Credentials cannot be True with ["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

jira = JiraClient()

@app.get("/")
async def root():
    return {"message": "SkyDashboard Backend is running"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/api/projects")
async def get_projects():
    return await jira.get_projects()

@app.get("/api/boards")
async def get_boards(project: str):
    return await jira.get_boards(project)

@app.get("/api/sprints")
async def get_sprints(board_id: int):
    return await jira.get_sprints(board_id)

@app.get("/api/dashboard/progress")
async def get_dashboard_progress(project: str = "SKY", sprint_id: int = None):
    return await jira.get_sprint_progress(project, sprint_id)

@app.get("/api/dashboard/phase-status")
async def get_phase_status(project: str = "SKY", board_id: int = None, sprint_id: int = None):
    return await jira.get_phase_progress(project, board_id, sprint_id)

@app.get("/api/dashboard/summary")
async def get_project_summary(project: str = "SKY"):
    return await jira.get_project_summary(project)

@app.get("/api/dashboard/bugs-by-component")
async def get_bugs_by_component(project: str = "SKY", sprint_id: int = None):
    # TODO: Update client method to support sprint_id if needed, but for now filtering project-wide bugs is safer for "Bugs" widget unless specified.
    # User asked "each sprint", so lets try to filter.
    return await jira.get_unresolved_bugs_by_component(project, sprint_id)

@app.get("/api/dashboard/developer-issues")
async def get_developer_issues(project: str = "SKY", sprint_id: int = None):
    return await jira.get_open_issues_pending(project, sprint_id)

@app.get("/api/dashboard/qa-risks")
async def get_qa_risks(project: str = "SKY"):
    return await jira.get_qa_risks(project)

# ============================================================================
# NEW DATA FLOW ENDPOINTS: Project ID → Boards → Sprints → Issues
# ============================================================================

@app.get("/api/project/{project_key}/id")
async def get_project_id(project_key: str):
    """Get project ID and metadata from project key"""
    return await jira.get_project_id(project_key)

@app.get("/api/project/{project_id}/boards")
async def get_boards_by_project(project_id: int):
    """Get all boards for a project using project ID"""
    return await jira.get_boards_by_project_id(project_id)

@app.get("/api/board/{board_id}/sprints")
async def get_board_sprints(board_id: int, state: str = "active,future,closed"):
    """Get sprints for a board with optional state filtering"""
    return await jira.get_sprints_by_board(board_id, state)

@app.get("/api/sprint/{sprint_id}/issues")
async def get_sprint_issues(sprint_id: int):
    """Get all issues in a specific sprint"""
    return await jira.get_sprint_issues_detailed(sprint_id)

@app.get("/api/issues/recent")
async def get_recent_issues(project_id: int, days: int = 30, board_id: int = None, issue_type: str = "Bug"):
    """Get issues of a specific type created in the last X days, optionally filtered by board"""
    return await jira.get_recent_issues(project_id, days, board_id, issue_type)

@app.get("/api/bugs/severity-stats")
async def get_bug_severity_stats(project_id: int, board_id: int = None, days: int = None, unresolved_only: bool = True):
    """Get bug counts grouped by severity (priority) for a project and board"""
    return await jira.get_bug_severity_stats(project_id, board_id, days, unresolved_only)

@app.get("/api/dashboard/developer-stats")
async def get_developer_stats(project: str, sprint_id: int = None):
    """Get unresolved issues aggregated by developer and status"""
    return await jira.get_developer_stats(project, sprint_id)

@app.get("/api/dashboard/board-quality")
async def get_board_quality(project_id: int):
    """Get Actual vs Not a Bug stats and Avg Resolution Time per board"""
    return await jira.get_board_quality_stats(project_id)

@app.get("/api/dashboard/bug-flow")
async def get_bug_flow(project_id: int):
    """Get bug reporting flow (Reporter -> Assignee)"""
    return await jira.get_bug_flow_stats(project_id)
