"""
AgoraMind Socratic Agent
Guides students through the hint ladder using Socratic questioning.
"""

import json
import random

from .base import BaseAgent
from ..prompts import SOCRATIC_AGENT_PROMPT

# Hint ladder questions organized by difficulty / understanding level
HINT_LADDER = {
    "none": [
        "Let's take a step back. What's the very first thing that comes to mind when you think about this concept? 🤔",
        "No worries — everyone starts somewhere! Can you think of a real-world example that might relate to this idea?",
        "Let's simplify this. If you had to break this problem into two smaller pieces, what would those pieces be?",
        "That's okay! Let me ask it differently: what do you think this concept is trying to describe or solve?",
        "Think about what you already know from everyday life. Is there anything familiar that connects to this idea?",
    ],
    "partial": [
        "You're on the right track! Can you dig a little deeper — *why* does that work the way it does?",
        "Good start! Now, what would happen if we changed one of the conditions? How would that affect your answer?",
        "Interesting thought! Can you give me a specific example to support your reasoning?",
        "You've got part of it. What's the missing piece that would make your explanation complete?",
        "That's a solid foundation. Now, can you explain how this connects to what we discussed earlier?",
    ],
    "good": [
        "Excellent thinking! 🌟 Now, can you think of a situation where this rule or idea might NOT apply?",
        "Great answer! How would you explain this concept to someone who's never encountered it before?",
        "You clearly understand the basics well. What's a more advanced application of this concept?",
        "Nice work! Can you see how this idea connects to other things you've learned in this area?",
        "Well reasoned! Now, if you had to teach this to a younger student, what analogy would you use?",
    ],
    "excellent": [
        "Outstanding! 🎉 You've really mastered this. Can you identify any limitations or edge cases in this concept?",
        "Brilliant reasoning! How might this concept evolve or be applied in cutting-edge research or industry?",
        "You've nailed it! Here's a challenge: can you formulate a question about this topic that would stump your classmates?",
        "Impressive depth! Can you compare and contrast this with a related but different concept?",
        "You're clearly an expert here! What's the most common misconception about this topic, and why do people get it wrong?",
    ],
}

# Fallback questions when analysis parsing fails
FALLBACK_QUESTIONS = [
    "Can you elaborate on that a bit more? What's your reasoning? 🤔",
    "Interesting! What evidence or examples can you think of to support that idea?",
    "That's a thoughtful response. What would you say is the key principle at work here?",
    "Good thinking! Now, can you connect that to the broader concept we're exploring?",
    "I appreciate your effort! Let's look at this from another angle — what if we considered it this way?",
]


class SocraticAgent(BaseAgent):
    """Agent that uses Socratic questioning to guide student discovery."""

    def __init__(self) -> None:
        super().__init__(SOCRATIC_AGENT_PROMPT)

    async def mock_response(self, messages: list[dict]) -> str:
        """Generate a Socratic follow-up question based on the analysis."""
        # Try to extract the analysis from the system message injected by the handler
        understanding_level = "partial"  # default

        for msg in reversed(messages):
            if msg.get("role") == "system" and "Analysis of student response" in msg.get("content", ""):
                try:
                    # Extract JSON from the analysis system message
                    analysis_text = msg["content"].replace("Analysis of student response: ", "")
                    analysis = json.loads(analysis_text)
                    understanding_level = analysis.get("understanding_level", "partial")
                except (json.JSONDecodeError, KeyError):
                    pass
                break

        # Select from the appropriate hint ladder level
        questions = HINT_LADDER.get(understanding_level, FALLBACK_QUESTIONS)
        return random.choice(questions)
