import os
import httpx
from dotenv import load_dotenv

load_dotenv()

class JiraClient:
    def __init__(self):
        self.domain = os.getenv("JIRA_DOMAIN")
        self.email = os.getenv("JIRA_EMAIL")
        self.token = os.getenv("JIRA_API_TOKEN")
        
        if not all([self.domain, self.email, self.token]):
            print("Warning: JIRA credentials not set in .env")

        self.base_url = f"https://{self.domain}/rest/api/2"
        self.auth = (self.email, self.token)
        self.headers = {"Accept": "application/json"}

    async def _search_jql(self, jql: str, fields: list = None, max_results: int = 50):
        if not self.token:
            return {"issues": []}

    async def _search_jql(self, jql: str, fields: list = None, max_results: int = 50):
        if not self.token:
            return {"issues": [], "total": 0}

        all_issues = []
        next_token = None
        page_size = 100

        # Handle comma-separated projects
        if "project =" in jql:
            import re
            match = re.search(r"project\s*=\s*(['\"]?)([^'\"\s&]+)\1", jql)
            if match:
                p_val = match.group(2)
                if "," in p_val:
                    p_list = [p.strip() for p in p_val.split(",")]
                    p_in = "project in (" + ",".join([f"'{p}'" for p in p_list]) + ")"
                    jql = jql.replace(match.group(0), p_in)

        async with httpx.AsyncClient() as client:
            try:
                url = self.base_url.replace("/api/2", "/api/3") + "/search/jql"
                
                while len(all_issues) < max_results:
                    payload = {
                        "jql": jql,
                        "fields": fields or ["summary", "status", "assignee", "priority", "created", "resolutiondate", "parent", "project"],
                        "maxResults": min(page_size, max_results - len(all_issues))
                    }
                    if next_token:
                        payload["nextPageToken"] = next_token

                    response = await client.post(
                        url,
                        auth=self.auth,
                        json=payload,
                        headers=self.headers,
                        timeout=15.0
                    )
                    
                    if response.status_code >= 400:
                        print(f"DEBUG: {response.status_code} ERROR for JQL: {jql}")
                        print(f"DEBUG: Response: {response.text}")
                        break
                    
                    response.raise_for_status()
                    data = response.json()
                    
                    issues = data.get("issues", [])
                    if not issues:
                        break
                        
                    all_issues.extend(issues)
                    
                    if data.get("isLast") is True:
                        break
                        
                    next_token = data.get("nextPageToken")
                    if not next_token:
                        break

                return {"issues": all_issues, "total": len(all_issues)}
            except Exception as e:
                print(f"Jira API Error: {e}")
                return {"issues": all_issues, "total": len(all_issues)}

    async def get_projects(self):
        if not self.token: return []
        async with httpx.AsyncClient() as client:
            try:
                # Explicitly try v3 for projects
                url = self.base_url.replace("/api/2", "/api/3") + "/project"
                response = await client.get(
                    url,
                    auth=self.auth,
                    headers=self.headers,
                    timeout=10.0
                )
                print(f"DEBUG: Projects Response Status: {response.status_code}")
                # print(f"DEBUG: Projects Response Body: {response.text}")
                
                response.raise_for_status()
                return [{"key": p["key"], "name": p["name"]} for p in response.json()]
            except Exception as e:
                print(f"Jira API Error: {e}")
                return []

    async def get_boards(self, project_key: str):
        if not self.token: return []
        async with httpx.AsyncClient() as client:
            try:
                # 1. Try strict filter
                url = f"https://{self.domain}/rest/agile/1.0/board"
                try:
                    response = await client.get(
                        url,
                        auth=self.auth,
                        params={"projectKeyOrId": project_key},
                        headers=self.headers,
                        timeout=5.0
                    )
                    response.raise_for_status()
                    data = response.json()
                    values = data.get("values", [])
                    if values:
                        return [{"id": b["id"], "name": b["name"], "type": b["type"]} for b in values]
                except Exception as e:
                    print(f"Agile Filter failed for {project_key}, trying fallback. Error: {e}")

                # 2. Fallback: Fetch ALL boards and filter loosely
                # Since we only have ~42 boards, this is acceptable.
                response = await client.get(
                    url,
                    auth=self.auth,
                    headers=self.headers,
                    timeout=10.0
                )
                response.raise_for_status()
                all_boards = response.json().get("values", [])
                
                # Filter/Sort logic:
                # Prioritize boards where Name contains Project Key (case-insensitive)
                # Return top 20 matches + the rest? Or just all sorted?
                # User wants "Specific to board", so letting them choose from All is safest fallback.
                
                # Sort: Matches first, then alpha
                def sort_key(b):
                    name = b["name"].lower()
                    key = project_key.lower()
                    if key in name: return 0 # Top priority
                    return 1
                
                all_boards.sort(key=sort_key)
                
                return [{"id": b["id"], "name": b["name"], "type": b["type"]} for b in all_boards]

            except Exception as e:
                print(f"Agile API Error: {e}")
                return []
                
    async def get_board_columns(self, board_id: int):
        if not board_id: return []
        async with httpx.AsyncClient() as client:
            try:
                url = f"https://{self.domain}/rest/agile/1.0/board/{board_id}/configuration"
                response = await client.get(url, auth=self.auth, headers=self.headers, timeout=10.0)
                if response.status_code == 200:
                   data = response.json()
                   # Map columns to statuses
                   # Structure: columnConfig -> columns -> [{name, statuses: [{id, self}]}]
                   columns = []
                   for col in data.get("columnConfig", {}).get("columns", []):
                       columns.append({
                           "name": col["name"],
                           "statuses": [s["id"] for s in col.get("statuses", [])] # Store status IDs
                       })
                   return columns
                return []
            except Exception as e:
                print(f"QA Risks Error: {e}")
                return []

    # ============================================================================
    # NEW DATA FLOW METHODS: Project ID → Boards → Sprints → Issues
    # ============================================================================

    async def get_project_id(self, project_key: str) -> dict:
        """Get project ID from project key"""
        if not self.token:
            return {"id": None, "key": project_key}
        
        async with httpx.AsyncClient() as client:
            try:
                url = f"https://{self.domain}/rest/api/3/project/{project_key}"
                response = await client.get(
                    url,
                    auth=self.auth,
                    headers=self.headers,
                    timeout=10.0
                )
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "id": int(data.get("id")),
                        "key": data.get("key"),
                        "name": data.get("name")
                    }
                return {"id": None, "key": project_key}
            except Exception as e:
                print(f"Project ID Error: {e}")
                return {"id": None, "key": project_key}

    async def get_boards_by_project_id(self, project_id: int) -> list:
        """Fetch boards using project ID (more reliable than project key)"""
        if not project_id:
            return []
        
        async with httpx.AsyncClient() as client:
            try:
                url = f"https://{self.domain}/rest/agile/1.0/board"
                response = await client.get(
                    url,
                    auth=self.auth,
                    params={"projectKeyOrId": project_id},
                    headers=self.headers,
                    timeout=10.0
                )
                if response.status_code == 200:
                    data = response.json()
                    return [
                        {
                            "id": b["id"],
                            "name": b["name"],
                            "type": b["type"]
                        }
                        for b in data.get("values", [])
                    ]
                return []
            except Exception as e:
                print(f"Boards by Project ID Error: {e}")
                return []

    async def get_sprints_by_board(self, board_id: int, states: str = "active,future,closed") -> list:
        """Fetch sprints for a board with state filtering"""
        if not board_id:
            return []
        
        async with httpx.AsyncClient() as client:
            try:
                url = f"https://{self.domain}/rest/agile/1.0/board/{board_id}/sprint"
                response = await client.get(
                    url,
                    auth=self.auth,
                    params={"state": states, "maxResults": 50},
                    headers=self.headers,
                    timeout=10.0
                )
                if response.status_code == 200:
                    data = response.json()
                    return [
                        {
                            "id": s["id"],
                            "name": s["name"],
                            "state": s["state"],
                            "startDate": s.get("startDate"),
                            "endDate": s.get("endDate")
                        }
                        for s in data.get("values", [])
                    ]
                return []
            except Exception as e:
                print(f"Sprints by Board Error: {e}")
                return []

    async def get_sprint_issues_detailed(self, sprint_id: int) -> list:
        """Fetch all issues in a specific sprint with full details"""
        if not sprint_id:
            return []
        
        async with httpx.AsyncClient() as client:
            try:
                url = f"https://{self.domain}/rest/agile/1.0/sprint/{sprint_id}/issue"
                response = await client.get(
                    url,
                    auth=self.auth,
                    params={"maxResults": 100},
                    headers=self.headers,
                    timeout=10.0
                )
                if response.status_code == 200:
                    data = response.json()
                    issues = []
                    for issue in data.get("issues", []):
                        fields = issue.get("fields", {})
                        issues.append({
                            "key": issue.get("key"),
                            "summary": fields.get("summary"),
                            "status": fields.get("status", {}).get("name"),
                            "assignee": fields.get("assignee", {}).get("displayName") if fields.get("assignee") else "Unassigned",
                            "priority": fields.get("priority", {}).get("name") if fields.get("priority") else "None",
                            "issuetype": fields.get("issuetype", {}).get("name"),
                            "created": fields.get("created"),
                            "components": [c.get("name") for c in fields.get("components", [])]
                        })
                    return issues
                return []
            except Exception as e:
                print(f"Sprint Issues Error: {e}")
                return []

    async def get_recent_issues(self, project_id: int, days: int = 30, board_id: int = None, issue_type: str = "Bug") -> dict:
        """
        Fetch issues of a specific type created in the last X days.
        If board_id is provided, uses Agile Board Issues API (covers sprints + backlog).
        If no board_id, uses Standard JQL search across the project.
        """
        if not project_id:
            return {"total": 0, "issues": [], "timeline": []}

        # Build JQL query
        jql = f"issuetype = '{issue_type}' AND created >= -{days}d"
        if not board_id:
            jql = f"project = {project_id} AND {jql}"
        
        jql += " ORDER BY created DESC"

        async with httpx.AsyncClient() as client:
            try:
                # Determine URL based on whether we have a board ID
                if board_id:
                    url = f"https://{self.domain}/rest/agile/1.0/board/{board_id}/issue"
                else:
                    # Standard API search has been moved/deprecated in favor of /search/jql
                    url = f"https://{self.domain}/rest/api/3/search/jql"

                params = {
                    "jql": jql,
                    "fields": "key,summary,created,reporter,priority,status,description,issuetype",
                    "maxResults": 200
                }

                response = await client.get(
                    url,
                    auth=self.auth,
                    params=params,
                    headers=self.headers,
                    timeout=20.0
                )
                
                if response.status_code != 200:
                    print(f"Jira API Error ({response.status_code}): {response.text}")
                    return {"total": 0, "issues": [], "timeline": []}

                data = response.json()
            except Exception as e:
                print(f"Error fetching issues: {e}")
                return {"total": 0, "issues": [], "timeline": []}

        issues = []
        timeline_map = {}

        for issue in data.get("issues", []):
            fields = issue.get("fields", {})
            issue_key = issue.get("key")
            
            created = fields.get("created", "")
            created_date = created.split("T")[0] if created else ""
            
            # Safely extract description
            description = fields.get("description", "")
            if isinstance(description, dict):
                # Handle ADF (Atlassian Document Format)
                content = description.get("content", [])
                text_content = []
                for p in content:
                    if p.get("type") == "paragraph":
                        for t in p.get("content", []):
                            if t.get("type") == "text":
                                text_content.append(t.get("text", ""))
                description = " ".join(text_content)[:200]
            elif isinstance(description, str):
                description = description[:200]
            else:
                description = ""
            
            issue_data = {
                "key": issue_key,
                "summary": fields.get("summary", ""),
                "description": description,
                "reporter": fields.get("reporter", {}).get("displayName", "Unknown") if fields.get("reporter") else "Unknown",
                "priority": fields.get("priority", {}).get("name", "None") if fields.get("priority") else "None",
                "status": fields.get("status", {}).get("name", "Unknown"),
                "created": created,
                "createdDate": created_date
            }
            issues.append(issue_data)
            
            # Count issues per day for timeline
            if created_date:
                timeline_map[created_date] = timeline_map.get(created_date, 0) + 1
        
        # Convert timeline map to sorted list
        timeline = [
            {"date": date, "count": count}
            for date, count in sorted(timeline_map.items())
        ]
        
        return {"total": len(issues), "issues": issues, "timeline": timeline}
        
    async def get_bug_severity_stats(self, project_id: int, board_id: int = None, days: int = None, unresolved_only: bool = True) -> list:
        """
        Fetch bug counts grouped by severity (priority).
        If board_id is provided, filters by board.
        Returns: list of {name: str, value: int, color: str}
        """
        if not project_id:
            return []

        # JQL for bugs
        jql = "issuetype = 'Bug'"
        if unresolved_only:
            jql += " AND statusCategory != Done"
            
        if days:
            jql += f" AND created >= -{days}d"
            
        if not board_id:
            jql = f"project = {project_id} AND {jql}"

        async with httpx.AsyncClient() as client:
            try:
                if board_id:
                    url = f"https://{self.domain}/rest/agile/1.0/board/{board_id}/issue"
                else:
                    url = f"https://{self.domain}/rest/api/3/search/jql"

                params = {
                    "jql": jql,
                    "fields": "priority",
                    "maxResults": 500
                }

                response = await client.get(
                    url,
                    auth=self.auth,
                    params=params,
                    headers=self.headers,
                    timeout=20.0
                )
                
                if response.status_code != 200:
                    return []

                data = response.json()
            except Exception as e:
                print(f"Error fetching severity stats: {e}")
                return []

        severity_counts = {}
        for issue in data.get("issues", []):
            priority = issue.get("fields", {}).get("priority", {}).get("name", "Medium")
            severity_counts[priority] = severity_counts.get(priority, 0) + 1

        # Map to standard Recharts format with colors
        priority_config = {
            "Highest": {"name": "Highest", "color": "#ef4444"},  # Red
            "High": {"name": "High", "color": "#f97316"},     # Orange
            "Medium": {"name": "Medium", "color": "#eab308"},   # Yellow
            "Low": {"name": "Low", "color": "#3b82f6"},      # Blue
            "Lowest": {"name": "Lowest", "color": "#94a3b8"},  # Slate
        }

        result = []
        # Sort by priority importance
        for p in ["Highest", "High", "Medium", "Low", "Lowest"]:
            if p in severity_counts:
                result.append({
                    "name": p,
                    "value": severity_counts[p],
                    "color": priority_config[p]["color"]
                })
        
        # Add any other priorities found
        for p, count in severity_counts.items():
            if p not in priority_config:
                result.append({
                    "name": p,
                    "value": count,
                    "color": "#64748b" # Default gray
                })

        return result

    async def get_sprints(self, board_id: int):
        if not board_id: return []
        async with httpx.AsyncClient() as client:
            try:
                # Fetch sprints for board (active and future usually, maybe closed if requested but let's stick to active/future for dashboard)
                url = f"https://{self.domain}/rest/agile/1.0/board/{board_id}/sprint"
                response = await client.get(
                    url, 
                    auth=self.auth, 
                    params={"state": "active,future"}, 
                    headers=self.headers,
                    timeout=10.0
                )
                if response.status_code == 200:
                    data = response.json()
                    return [{"id": s["id"], "name": s["name"], "state": s["state"]} for s in data.get("values", [])]
                return []
            except Exception as e:
                print(f"Agile Sprint Error: {e}")
                return []

    async def get_sprint_progress(self, project_key: str, sprint_id: int = None):
        # If specific sprint selected, use it. Else use active sprints.
        if sprint_id:
            jql = f"project = {project_key} AND sprint = {sprint_id}"
        else:
            jql = f"project = {project_key} AND sprint in openSprints()"
            
        data = await self._search_jql(jql, fields=["status"], max_results=100)
        
        total = len(data.get("issues", []))
        
        # Fallback logic only if NO specific sprint was requested (i.e. project view)
        if total == 0 and not sprint_id:
            jql = f"project = {project_key} AND created >= -90d"
            data = await self._search_jql(jql, fields=["status"], max_results=100)
            total = len(data.get("issues", []))

        # If still 0, return 0
        if total == 0: return 0
        
        done = sum(1 for i in data["issues"] if i["fields"]["status"]["statusCategory"]["name"] == "Done")
        return int((done / total) * 100)

    async def get_phase_progress(self, project_key: str, board_id: int = None, sprint_id: int = None):
        """Fetch issues and map to board columns with counts and semantic status"""
        phases_map = {} # name -> {name, count, status}
        
        # 1. Determine Columns/Phases from Board Configuration
        if board_id:
            columns = await self.get_board_columns(board_id)
            if columns:
                for col in columns:
                    phases_map[col["name"]] = {
                        "name": col["name"], 
                        "status_ids": col["statuses"], 
                        "count": 0, 
                        "status": "waiting"
                    }
        
        # Fallback if no board columns found
        if not phases_map:
            phases_map = {
                "To Do": {"name": "To Do", "status_ids": [], "count": 0, "status": "waiting"},
                "In Progress": {"name": "In Progress", "status_ids": [], "count": 0, "status": "waiting"},
                "Done": {"name": "Done", "status_ids": [], "count": 0, "status": "completed"}
            }

        # 2. Build JQL Query
        if sprint_id:
            jql = f"project = '{project_key}' AND sprint = {sprint_id}"
        elif board_id:
            jql = f"project = '{project_key}' AND sprint in openSprints()"
        else:
            jql = f"project = '{project_key}' AND created >= -30d"
        
        # Fetch status data for up to 1000 issues to ensure accurate counts
        data = await self._search_jql(jql, fields=["status"], max_results=1000)
        all_issues = data.get("issues", [])
        
        # 3. Aggregate Counts
        for issue in all_issues:
            status_id = issue["fields"]["status"]["id"]
            status_name = issue["fields"]["status"]["name"]
            
            match_found = False
            for phase in phases_map.values():
                # Match by ID if we have board config
                if phase.get("status_ids") and status_id in phase["status_ids"]:
                    phase["count"] += 1
                    match_found = True
                    break
            
            # Fallback to name matching if ID match failed or no board config
            if not match_found:
                # Basic heuristic
                s_name_lower = status_name.lower()
                for phase in phases_map.values():
                    p_name_lower = phase["name"].lower()
                    if p_name_lower in s_name_lower or s_name_lower in p_name_lower:
                        phase["count"] += 1
                        break

        # 4. Finalize Semantic Status
        result = []
        for p in phases_map.values():
            p_name = p["name"].lower()
            
            if "done" in p_name or "closed" in p_name or "resolved" in p_name:
                p["status"] = "completed"
            elif p["count"] > 0:
                p["status"] = "in-progress" # Represents "Active"
            else:
                p["status"] = "waiting" # Represents "Empty/Idle"
                
            # Remove helper fields
            if "status_ids" in p: del p["status_ids"]
            result.append(p)
            
        return result

    async def get_unresolved_bugs_by_component(self, project_key: str, sprint_id: int = None):
        jql = f"project = {project_key} AND issuetype = Bug AND resolution = Unresolved"
        if sprint_id:
             jql += f" AND sprint = {sprint_id}"
        
        data = await self._search_jql(jql, fields=["components"], max_results=100)
        
        # ... logic ...
        counts = {}
        for issue in data.get("issues", []):
            comps = issue["fields"].get("components", [])
            if not comps:
                counts["No Component"] = counts.get("No Component", 0) + 1
            else:
                for c in comps:
                    counts[c["name"]] = counts.get(c["name"], 0) + 1
        
        return [{"component": k, "bugs": v} for k, v in counts.items()]

    async def get_open_issues_pending(self, project_key: str, sprint_id: int = None):
        jql = f"project = {project_key} AND statusCategory != Done ORDER BY created DESC"
        if sprint_id:
             jql = f"project = {project_key} AND sprint = {sprint_id} AND statusCategory != Done ORDER BY created DESC"
             
        data = await self._search_jql(jql, fields=["assignee", "summary", "duedate", "status"], max_results=20)
        
        issues = []
        for i in data.get("issues", []):
            issues.append({
                "id": i["key"],
                "assignee": i["fields"]["assignee"]["displayName"] if i["fields"]["assignee"] else "Unassigned",
                "summary": i["fields"]["summary"],
                "due": i["fields"]["duedate"] or "No Date",
                "status": i["fields"]["status"]["name"]
            })
        return issues

    async def get_qa_risks(self, project_key: str):
        jql_crit = f"project = {project_key} AND issuetype = Bug AND priority = High AND created >= -30d"
        data_crit = await self._search_jql(jql_crit, max_results=0)
        
        return {
            "critical_bugs": data_crit.get("total", 0),
            "regressions": 0, 
            "env_issues": 0
        }

    async def get_project_summary(self, project_key: str):
        # 1. Fetch latest issue to get Project Details & Last Activity
        jql = f"project = {project_key} ORDER BY updated DESC"
        data = await self._search_jql(jql, fields=["project", "updated", "created"], max_results=1)
        
        project_name = project_key
        last_activity = "N/A"
        
        if data.get("issues"):
            issue = data["issues"][0]
            project_name = issue["fields"]["project"]["name"]
            last_activity = issue["fields"]["updated"][:10] # YYYY-MM-DD
            
        # 2. Determine Health Status based on Critical Bugs
        # Reuse existing risk logic or simple count
        risks = await self.get_qa_risks(project_key)
        criticals = risks.get("critical_bugs", 0)
        
        status = "Healthy"
        if criticals > 0: status = "Needs Attention"
        if criticals > 5: status = "At Risk"

        return {
            "name": project_name,
            "key": project_key,
            "last_activity": last_activity,
            "manager": "Agile Team", # Fallback as we can't fetch lead
            "status": status,
            "total_issues": data.get("total", 0)
        }

    async def get_developer_stats(self, project_key: str, sprint_id: int = None):
        """Aggregate unresolved issues by assignee and status for developer workload chart"""
        jql = f"project = '{project_key}' AND statusCategory != Done"
        if sprint_id:
            jql += f" AND sprint = {sprint_id}"
        
        data = await self._search_jql(jql, fields=["assignee", "status"], max_results=200)
        
        stats = {} # assignee -> {status -> count}
        for issue in data.get("issues", []):
            assignee = issue["fields"]["assignee"]["displayName"] if issue["fields"]["assignee"] else "Unassigned"
            status = issue["fields"]["status"]["name"]
            
            if assignee not in stats:
                stats[assignee] = {"name": assignee}
            
            stats[assignee][status] = stats[assignee].get(status, 0) + 1
            
        return list(stats.values())

    async def get_board_quality_stats(self, project_id: int):
        """Fetch bug quality metrics (Actual vs Not a Bug) and resolution time per board"""
        boards = await self.get_boards_by_project_id(project_id)
        result = []
        
        async with httpx.AsyncClient() as client:
            for board in boards:
                board_id = board["id"]
                # Fetch bugs for last 90 days to have enough volume
                jql = f"issuetype = Bug AND created >= -90d"
                url = f"https://{self.domain}/rest/agile/1.0/board/{board_id}/issue"
                params = {
                    "jql": jql,
                    "fields": "resolution,created,resolutiondate",
                    "maxResults": 100
                }
                
                try:
                    res = await client.get(url, auth=self.auth, params=params, headers=self.headers, timeout=10.0)
                    if res.status_code != 200: continue
                    data = res.json()
                    
                    actual_bugs = 0
                    not_a_bug = 0
                    total_res_time = 0
                    resolved_count = 0
                    
                    not_bug_resolutions = ["Invalid", "Duplicate", "Won't Fix", "Cannot Reproduce", "Declined"]
                    
                    from datetime import datetime
                    
                    for issue in data.get("issues", []):
                        fields = issue.get("fields", {})
                        res_name = fields.get("resolution", {}).get("name") if fields.get("resolution") else None
                        
                        if res_name in not_bug_resolutions:
                            not_a_bug += 1
                        else:
                            actual_bugs += 1
                            
                        # Resolution Time
                        res_date_str = fields.get("resolutiondate")
                        created_str = fields.get("created")
                        
                        if res_date_str and created_str:
                            try:
                                # Standard Jira timestamp: 2024-03-20T10:00:00.000+0000
                                res_date = datetime.strptime(res_date_str.split(".")[0], "%Y-%m-%dT%H:%M:%S")
                                created_date = datetime.strptime(created_str.split(".")[0], "%Y-%m-%dT%H:%M:%S")
                                diff = (res_date - created_date).total_seconds() / 3600 # hours
                                total_res_time += diff
                                resolved_count += 1
                            except:
                                pass
                    
                    avg_time = round(total_res_time / resolved_count, 1) if resolved_count > 0 else 0
                    
                    result.append({
                        "name": board["name"],
                        "actual": actual_bugs,
                        "invalid": not_a_bug,
                        "avgTime": avg_time
                    })
                except Exception as e:
                    print(f"Error fetching board {board_id} quality: {e}")
                    
        return result

    async def get_bug_flow_stats(self, project_id: int):
        """Aggregate Reporter -> Assignee mappings to see bug report patterns"""
        # Search for bugs in the project
        jql = f"project = {project_id} AND issuetype = Bug"
        data = await self._search_jql(jql, fields=["reporter", "assignee"], max_results=300)
        
        flow = {} # (reporter, assignee) -> count
        for issue in data.get("issues", []):
            fields = issue.get("fields", {})
            reporter = fields["reporter"]["displayName"] if fields.get("reporter") else "Unknown"
            assignee = fields["assignee"]["displayName"] if fields.get("assignee") else "Unassigned"
            
            key = (reporter, assignee)
            flow[key] = flow.get(key, 0) + 1
            
        # Convert to list for chart
        result = [{"reporter": k[0], "assignee": k[1], "count": v} for k, v in flow.items()]
        # Sort by count desc
        result.sort(key=lambda x: x["count"], reverse=True)
        return result[:10] # Top 10 flows

    async def get_bug_stats_by_epics(self):
        """Fetch bug statistics for specific epics (App, Cloud, PCS) across projects"""
        # Epic mappings based on user info
        epic_map = {
            "APP": [84757, 84760],
            "CLOUD": [84756, 84759],
            "PCS": [84758, 84793]
        }
        
        all_ids = []
        for ids in epic_map.values():
            all_ids.extend(ids)
            
        epic_ids_str = ",".join(map(str, all_ids))
        main_jql = f"parent in ({epic_ids_str}) AND issuetype = Bug AND createdDate >= '2024-01-01'"
        
        # Provide exact JQLs for user verification
        jql_queries = {
            "APP": f"parent in (84757, 84760) AND issuetype = Bug AND createdDate >= '2024-01-01'",
            "CLOUD": f"parent in (84756, 84759) AND issuetype = Bug AND createdDate >= '2024-01-01'",
            "PCS": f"parent in (84758, 84793) AND issuetype = Bug AND createdDate >= '2024-01-01'"
        }
        
        # Fetch data including status and priority
        # We increase max_results just in case there are many bugs across history
        data = await self._search_jql(main_jql, fields=["created", "resolutiondate", "parent", "status", "priority"], max_results=2000)
        
        timeline_data = {} # date -> {APP: 0, CLOUD: 0, PCS: 0}
        totals = {"APP": 0, "CLOUD": 0, "PCS": 0}
        
        # breakdown: {category: {done: 0, open: 0, priorities: {}, total: 0, fix_time_total_hours: 0}}
        breakdown = {cat: {"done": 0, "open": 0, "priorities": {}, "total": 0, "fix_time_total_hours": 0} for cat in epic_map.keys()}
        
        from datetime import datetime, timedelta
        
        for issue in data.get("issues", []):
            fields = issue.get("fields", {})
            created = fields.get("created", "")
            if not created: continue
            
            date_str = created.split("T")[0]
            
            # Identify category based on parent ID
            parent = fields.get("parent", {})
            parent_id = int(parent.get("id")) if parent.get("id") else None
            
            category = None
            for cat, ids in epic_map.items():
                if parent_id in ids:
                    category = cat
                    break
            
            if category:
                # All-time totals and breakdown
                totals[category] += 1
                breakdown[category]["total"] += 1
                
                status_cat = fields.get("status", {}).get("statusCategory", {}).get("name", "To Do")
                if status_cat == "Done":
                    breakdown[category]["done"] += 1
                    
                    # Calculate fix time if resolved
                    resolution = fields.get("resolutiondate")
                    if resolution:
                        try:
                            created_dt = datetime.strptime(created[:19], "%Y-%m-%dT%H:%M:%S")
                            resolved_dt = datetime.strptime(resolution[:19], "%Y-%m-%dT%H:%M:%S")
                            diff = resolved_dt - created_dt
                            hours = diff.total_seconds() / 3600
                            if hours > 0:
                                breakdown[category]["fix_time_total_hours"] += hours
                        except Exception:
                            pass
                else:
                    breakdown[category]["open"] += 1
                    
                priority = fields.get("priority", {}).get("name", "Medium")
                breakdown[category]["priorities"][priority] = breakdown[category]["priorities"].get(priority, 0) + 1
                
                # Daily counts for timeline
                if date_str not in timeline_data:
                    timeline_data[date_str] = {"APP": 0, "CLOUD": 0, "PCS": 0}
                timeline_data[date_str][category] += 1
                
        # Generate last 90 days timeline
        today = datetime.now()
        start_date = today - timedelta(days=89)
        
        timeline = []
        for i in range(90):
            d = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
            counts = timeline_data.get(d, {"APP": 0, "CLOUD": 0, "PCS": 0})
            timeline.append({
                "date": d,
                "displayDate": (start_date + timedelta(days=i)).strftime("%d %b"),
                "APP": counts.get("APP", 0),
                "CLOUD": counts.get("CLOUD", 0),
                "PCS": counts.get("PCS", 0)
            })
            
        return {
            "totals": totals,
            "timeline": timeline,
            "breakdown": breakdown,
            "jql_queries": jql_queries
        }
    async def get_sprint_timeline(self, board_ids: list = [50, 140]) -> list:
        """Fetch sprints for specific boards and format for timeline"""
        all_sprints = []
        
        async with httpx.AsyncClient() as client:
            for board_id in board_ids:
                try:
                    # Fetch Board Name first
                    board_url = f"https://{self.domain}/rest/agile/1.0/board/{board_id}"
                    board_res = await client.get(board_url, auth=self.auth, headers=self.headers, timeout=10.0)
                    board_name = "Unknown Board"
                    if board_res.status_code == 200:
                        raw_name = board_res.json().get("name", "Unknown Board")
                        # Map names as requested
                        if "Software Engineering" in raw_name:
                            board_name = "App/Cloud"
                        elif "JI board" in raw_name:
                            board_name = "PCS"
                        else:
                            board_name = raw_name

                    # Fetch Sprints
                    url = f"https://{self.domain}/rest/agile/1.0/board/{board_id}/sprint"
                    response = await client.get(
                        url,
                        auth=self.auth,
                        params={"state": "active", "maxResults": 50},
                        headers=self.headers,
                        timeout=10.0
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        for s in data.get("values", []):
                            # We need name, start, end, state
                            start_date = s.get("startDate")
                            end_date = s.get("endDate")
                            
                            if not start_date or not end_date:
                                continue

                            all_sprints.append({
                                "boardName": board_name,
                                "sprintName": s["name"],
                                "startDate": start_date,
                                "endDate": end_date,
                                "state": s["state"]
                            })
                except Exception as e:
                    print(f"Error fetching timeline for board {board_id}: {e}")
                    
        # Sort chronologically by start date
        all_sprints.sort(key=lambda x: x["startDate"])
        return all_sprints
