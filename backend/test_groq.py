import os
import httpx
from dotenv import load_dotenv

load_dotenv()

# Force ignore proxy
os.environ["NO_PROXY"] = "*"

api_key = os.getenv("GROQ_API_KEY")
print(f"API Key found: {'Yes' if api_key else 'No'}")

try:
    response = httpx.get(
        "https://api.groq.com/openai/v1/models",
        headers={"Authorization": f"Bearer {api_key}"},
        timeout=10.0
    )
    print(f"Status Code: {response.status_code}")
    print(response.json())
except Exception as e:
    import traceback
    traceback.print_exc()
