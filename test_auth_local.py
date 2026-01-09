import gspread
import json
import os

def test_auth():
    json_path = "backend/indigo-coder-466609-a0-903d80189cd0.json"
    print(f"Testing auth with: {json_path}")
    
    try:
        with open(json_path, "r") as f:
            creds = json.load(f)
        
        print("JSON loaded successfully")
        print(f"Email: {creds.get('client_email')}")
        
        # Try to connect
        gc = gspread.service_account(filename=json_path)
        print("GSpread client created")
        
        # Try to open the sheet (this triggers auth)
        sheet_name = "Progress_check"
        print(f"Opening sheet: {sheet_name}")
        sh = gc.open(sheet_name)
        print("SUCCESS: Sheet opened!")
        
    except Exception as e:
        print(f"FAILED: {e}")
        if "invalid_grant" in str(e):
            print("Confirmed: This is the same JWT Signature error.")

if __name__ == "__main__":
    test_auth()
