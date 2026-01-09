
import os
import json
import unittest
from unittest.mock import patch, MagicMock

# Import the class to test
from gsheets_client import GSheetsClient

class TestJWTFix(unittest.TestCase):
    def test_private_key_newline_replacement(self):
        # Sample credentials with escaped newlines
        sample_creds = {
            "type": "service_account",
            "project_id": "test-project",
            "private_key": "-----BEGIN PRIVATE KEY-----\\nABC\\nDEF\\n-----END PRIVATE KEY-----\\n",
            "client_email": "test@example.com"
        }
        
        # Mocking the environment variable
        env_json = json.dumps(sample_creds)
        
        with patch.dict(os.environ, {"GSHEETS_JSON": env_json}):
            client = GSheetsClient()
            
            # Mock gspread.service_account_from_dict to avoid actual network calls
            with patch("gspread.service_account_from_dict") as mock_sa:
                client._connect()
                
                # Check the dictionary passed to gspread
                passed_dict = mock_sa.call_args[0][0]
                expected_key = "-----BEGIN PRIVATE KEY-----\nABC\nDEF\n-----END PRIVATE KEY-----\n"
                
                print(f"Original key (escaped): {sample_creds['private_key']!r}")
                print(f"Processed key (expected): {expected_key!r}")
                print(f"Resulting key: {passed_dict['private_key']!r}")
                
                self.assertEqual(passed_dict["private_key"], expected_key)
                print("\n✅ Verification SUCCESS: Escaped newlines handled correctly.")

if __name__ == "__main__":
    unittest.main()
