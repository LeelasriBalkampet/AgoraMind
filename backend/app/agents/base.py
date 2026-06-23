"""
AgoraMind Base Agent
Abstract base class for all Socratic tutoring agents with OpenAI + mock support.
"""

import os
import traceback
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

# Force ignore system proxies which were causing connection errors
os.environ["NO_PROXY"] = "*"

# Check for Groq key first, then fallback to OpenAI
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

API_KEY = GROQ_API_KEY or OPENAI_API_KEY
USE_MOCK = not API_KEY or API_KEY == "your_key_here"

if not USE_MOCK:
    if GROQ_API_KEY:
        client = AsyncOpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
        DEFAULT_MODEL = "llama-3.3-70b-versatile"
        print("[SUCCESS] Connected to Groq API")
    else:
        client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        DEFAULT_MODEL = "gpt-3.5-turbo"
        print("[SUCCESS] Connected to OpenAI API")
else:
    client = None
    DEFAULT_MODEL = "mock"
    print("[WARNING] No API key found. Running in MOCK/DEMO mode.")

class BaseAgent:
    """Base class for all Socratic tutoring agents."""

    def __init__(self, system_prompt: str) -> None:
        self.system_prompt = system_prompt

    async def run(self, messages: list[dict], override_system_prompt: str = None) -> str:
        """Run the agent with the given message history."""
        if USE_MOCK:
            return await self.mock_response(messages)

        try:
            # We want JSON response for Analysis and Fitness agents, but standard text for Socratic and Question.
            # However, standard completions work fine for all of them if prompted correctly.
            final_system_prompt = override_system_prompt if override_system_prompt is not None else self.system_prompt
            response = await client.chat.completions.create(
                model=DEFAULT_MODEL,
                messages=[
                    {"role": "system", "content": final_system_prompt},
                    *messages,
                ],
                temperature=0.7,
                max_tokens=500,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"API error: {e}")
            traceback.print_exc()
            return await self.mock_response(messages)

    async def mock_response(self, messages: list[dict]) -> str:
        """Override in subclasses for mock responses."""
        return "I'm here to help you learn. What would you like to explore?"
