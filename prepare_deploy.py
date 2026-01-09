import json
import base64
import sys

def prepare_env_var():
    file_path = "backend/indigo-coder-466609-a0-903d80189cd0.json"
    try:
        with open(file_path, "r") as f:
            creds = json.load(f)
        
        # Ensure private key is clean before encoding
        if "private_key" in creds:
            pk = creds["private_key"]
            creds["private_key"] = pk.replace("\\n", "\n").strip()
            if not creds["private_key"].endswith("\n"):
                creds["private_key"] += "\n"
        
        json_str = json.dumps(creds)
        
        print("\n=== OPTION 1: Base64 (STRONGLY RECOMMENDED) ===")
        print("This avoids all character mangling issues on Render.")
        b64_val = base64.b64encode(json_str.encode('utf-8')).decode('utf-8')
        print(f"\nGSHEETS_JSON={b64_val}")
        
        print("\n=== OPTION 2: Direct JSON (Use with caution) ===")
        print("Copy EVERYTHING between the quotes below. Do NOT add extra quotes in Render.")
        print(f"\nGSHEETS_JSON={json_str}")
        
        print("\n=== VERIFICATION ===")
        print(f"Service Account Email: {creds.get('client_email')}")
        print(f"Private Key Length: {len(creds.get('private_key', ''))}")
        
    except FileNotFoundError:
        print(f"Error: {file_path} not found. Please ensure the file exists in the backend folder.")

if __name__ == "__main__":
    prepare_env_var()
