
import os
import json
import unittest
from unittest.mock import patch, MagicMock

# Import the class to test
from gsheets_client import GSheetsClient

class TestJWTFix(unittest.TestCase):
    def test_private_key_formatting_variants(self):
        # Case 1: Direct JSON with escaped newlines and extra quotes/whitespace
        sample_creds = {
            "type": "service_account",
            "private_key": "  \"-----BEGIN PRIVATE KEY-----\\nABC\\nDEF\\n-----END PRIVATE KEY-----\\n\"  ",
        }
        env_json = json.dumps(sample_creds)
        
        with patch.dict(os.environ, {"GSHEETS_JSON": env_json}):
            client = GSheetsClient()
            with patch("gspread.service_account_from_dict") as mock_sa:
                client._connect()
                passed_dict = mock_sa.call_args[0][0]
                expected_key = "-----BEGIN PRIVATE KEY-----\nABC\nDEF\n-----END PRIVATE KEY-----\n"
                self.assertEqual(passed_dict["private_key"], expected_key)
                print("✅ Direct JSON with escaped newlines and extra formatting handled.")

    def test_private_key_missing_trailing_newline(self):
        # Case 2: Key missing trailing newline (common source of JWT errors)
        sample_creds = {
            "type": "service_account",
            "private_key": "-----BEGIN PRIVATE KEY-----\nABC\nDEF\n-----END PRIVATE KEY-----",
        }
        env_json = json.dumps(sample_creds)
        
        with patch.dict(os.environ, {"GSHEETS_JSON": env_json}):
            client = GSheetsClient()
            with patch("gspread.service_account_from_dict") as mock_sa:
                client._connect()
                passed_dict = mock_sa.call_args[0][0]
                expected_key = "-----BEGIN PRIVATE KEY-----\nABC\nDEF\n-----END PRIVATE KEY-----\n"
                self.assertEqual(passed_dict["private_key"], expected_key)
                print("✅ Handled missing trailing newline.")

    def test_base64_encoded_json(self):
        sample_creds = {
            "type": "service_account",
            "private_key": "-----BEGIN PRIVATE KEY-----\nABC\nDEF\n-----END PRIVATE KEY-----\n",
        }
        import base64
        env_json = base64.b64encode(json.dumps(sample_creds).encode('utf-8')).decode('utf-8')
        
        with patch.dict(os.environ, {"GSHEETS_JSON": env_json}):
            client = GSheetsClient()
            with patch("gspread.service_account_from_dict") as mock_sa:
                client._connect()
                passed_dict = mock_sa.call_args[0][0]
                self.assertEqual(passed_dict["private_key"], sample_creds["private_key"])
                print("✅ Base64 encoded JSON handled.")

if __name__ == "__main__":
    unittest.main()
