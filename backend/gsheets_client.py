
import gspread
import pandas as pd
import os
import logging
import asyncio

logger = logging.getLogger("SkyDashboard.GSheets")

class GSheetsClient:
    def __init__(self):
        self.json_path = os.path.join(os.path.dirname(__file__), "indigo-coder-466609-a0-903d80189cd0.json")
        self.sheet_name = "Progress_check"
        self.tab_name = "Sheet1"
        self.gc = None

    def _connect(self):
        if not self.gc:
            env_json = os.getenv("GSHEETS_JSON")
            env_path = os.getenv("GSHEETS_JSON_PATH")
            
            if env_json:
                import json
                creds_dict = json.loads(env_json)
                self.gc = gspread.service_account_from_dict(creds_dict)
                logger.info("Connected to GSheets using environment variable")
            else:
                target_path = env_path if env_path else self.json_path
                if not os.path.exists(target_path):
                    logger.error(f"Credentials not found at {target_path}")
                    raise FileNotFoundError(f"Credentials not found at {target_path}")
                self.gc = gspread.service_account(filename=target_path)
                logger.info(f"Connected to GSheets using file: {target_path}")
        return self.gc

    def _get_all_values_sync(self, tab_name):
        gc = self._connect()
        sh = gc.open(self.sheet_name)
        worksheet = sh.worksheet(tab_name)
        return worksheet.get_all_values()

    def get_section_average(self, df, section_name):
        try:
            # Strip whitespace from first column to avoid index issues
            df[0] = df[0].str.strip()
            
            # Find the section start
            matches = df[df[0] == section_name].index
            if len(matches) == 0:
                logger.warning(f"Section {section_name} not found in sheet")
                return 0.0, 0.0
            
            start_idx = matches[0]
            
            # Find end of section
            end_idx = start_idx + 1
            while end_idx < len(df) and any(df.iloc[end_idx]):
                end_idx += 1
            
            # Extract rows of the section (skip header)
            section_rows = df.iloc[start_idx+2:end_idx]
            
            # Find Average row
            avg_row = section_rows[section_rows[0].str.contains("Average", na=False)]
            
            if avg_row.empty:
                logger.warning(f"Average row not found in section {section_name}")
                return 0.0, 0.0
                
            dev_avg = float(avg_row[1].values[0]) if avg_row[1].values[0] else 0.0
            qa_avg = float(avg_row[2].values[0]) if avg_row[2].values[0] else 0.0
            
            return dev_avg, qa_avg
        except Exception as e:
            logger.error(f"Error parsing section {section_name}: {e}")
            return 0.0, 0.0

    async def get_sheet_data(self):
        try:
            all_values = await asyncio.to_thread(self._get_all_values_sync, self.tab_name)
            df = pd.DataFrame(all_values)

            pcs_dev, pcs_qa = self.get_section_average(df, "PCS")
            cloud_dev, cloud_qa = self.get_section_average(df, "Cloud")
            app_dev, app_qa = self.get_section_average(df, "APP")

            return {
                "pcs": {"development": pcs_dev, "qa": pcs_qa},
                "cloud": {"development": cloud_dev, "qa": cloud_qa},
                "app": {"development": app_dev, "qa": app_qa},
                "status": "success"
            }
        except Exception as e:
            logger.error(f"Failed to fetch Google Sheets data: {e}")
            return {
                "error": str(e),
                "status": "error"
            }

    async def get_test_coverage(self):
        try:
            all_values = await asyncio.to_thread(self._get_all_values_sync, "Sheet2")
            if not all_values:
                return {"status": "success", "data": [], "timeline": {}}
            
            data = []
            # Extract test coverage table (rows 1-7, cols A-D usually)
            for row in all_values[1:7]: # Explicit range for the main table
                if not row or not any(row): continue
                data.append({
                    "test_type": row[0].strip() if len(row) > 0 else "Unknown",
                    "pcs": row[1].strip() if len(row) > 1 else "0%",
                    "cloud": row[2].strip() if len(row) > 2 else "0%",
                    "app": row[3].strip() if len(row) > 3 else "0%"
                })
            
            # Extract QA Progress Timeline (G2, G3, G4)
            # F2: QA, G2: value
            # F3: APP, G3: value
            # F4: PCS, G4: value
            timeline = {
                "QA": all_values[1][6] if len(all_values) > 1 and len(all_values[1]) > 6 else "0 days",
                "APP": all_values[2][6] if len(all_values) > 2 and len(all_values[2]) > 6 else "0 days",
                "PCS": all_values[3][6] if len(all_values) > 3 and len(all_values[3]) > 6 else "0 days"
            }
            
            return {
                "status": "success",
                "data": data,
                "timeline": timeline
            }
        except Exception as e:
            logger.error(f"Failed to fetch Test Coverage data: {e}")
            return {
                "error": str(e),
                "status": "error"
            }

    async def get_qa_timeline(self):
        """Specifically fetch the QA timeline data from Sheet2"""
        try:
            all_values = await asyncio.to_thread(self._get_all_values_sync, "Sheet2")
            if not all_values or len(all_values) < 4:
                return {}
            
            # G is column index 6
            timeline = {}
            for i, label in enumerate(["QA", "APP", "PCS"], start=1):
                if len(all_values[i]) > 6:
                    timeline[label] = all_values[i][6].strip()
                else:
                    timeline[label] = "0 days"
            return timeline
        except Exception as e:
            logger.error(f"Failed to fetch QA timeline: {e}")
            return {}

gsheets = GSheetsClient()
