"""
AgoraMind Analysis Agent
Analyzes student responses to identify understanding gaps and misconceptions.
"""

import json

from .base import BaseAgent
from ..prompts import ANALYSIS_AGENT_PROMPT

# Keywords that suggest the student has some understanding
POSITIVE_INDICATORS = [
    "because", "therefore", "since", "means that", "so that",
    "in order to", "for example", "such as", "specifically",
    "the reason", "this shows", "this means", "which leads to",
    "as a result", "consequently", "i think", "i believe",
]

# Keywords that suggest confusion or uncertainty
CONFUSION_INDICATORS = [
    "i don't know", "not sure", "maybe", "i guess", "confused",
    "don't understand", "no idea", "what is", "help me",
    "i'm lost", "can you explain", "what do you mean",
    "i forgot", "never learned",
]


class AnalysisAgent(BaseAgent):
    """Agent that analyzes student responses for understanding gaps."""

    def __init__(self) -> None:
        super().__init__(ANALYSIS_AGENT_PROMPT)

    async def mock_response(self, messages: list[dict]) -> str:
        """Analyze the student's response based on length and keyword heuristics."""
        # Get the last student message
        last_user_msg = ""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                last_user_msg = msg.get("content", "")
                break

        text_lower = last_user_msg.lower()
        word_count = len(last_user_msg.split())

        # Count positive and confusion indicators
        positive_count = sum(1 for kw in POSITIVE_INDICATORS if kw in text_lower)
        confusion_count = sum(1 for kw in CONFUSION_INDICATORS if kw in text_lower)

        # Determine understanding level
        if confusion_count >= 2 or word_count < 5:
            level = "none"
            gaps = [
                "Student appears uncertain about the core concept",
                "Response lacks specific details or reasoning",
                "Foundational understanding may need reinforcement",
            ]
            misconceptions = ["May have incomplete mental model of the topic"]
            strengths = ["Student is engaged and attempting to answer"]
        elif word_count < 15 or (confusion_count > 0 and positive_count == 0):
            level = "partial"
            gaps = [
                "Response could benefit from more specific examples",
                "Reasoning chain is incomplete",
            ]
            misconceptions = []
            strengths = [
                "Student shows willingness to engage with the material",
                "Basic awareness of the topic is present",
            ]
        elif positive_count >= 2 and word_count >= 30:
            level = "excellent"
            gaps = []
            misconceptions = []
            strengths = [
                "Student demonstrates strong reasoning with evidence",
                "Response shows deep engagement with the concept",
                "Able to articulate ideas clearly and specifically",
            ]
        else:
            level = "good"
            gaps = ["Could explore edge cases or alternative perspectives"]
            misconceptions = []
            strengths = [
                "Student provides a reasonable explanation",
                "Shows understanding of key ideas",
            ]

        # Determine topic area from conversation context
        topic_area = "general"
        for msg in messages:
            content = msg.get("content", "").lower()
            if any(kw in content for kw in ["math", "algebra", "calculus", "equation"]):
                topic_area = "mathematics"
                break
            elif any(kw in content for kw in ["physics", "chemistry", "biology", "science"]):
                topic_area = "science"
                break
            elif any(kw in content for kw in ["programming", "code", "python", "algorithm"]):
                topic_area = "computer science"
                break
            elif any(kw in content for kw in ["history", "war", "civilization"]):
                topic_area = "history"
                break

        analysis = {
            "understanding_level": level,
            "gaps": gaps,
            "misconceptions": misconceptions,
            "strengths": strengths,
            "topic_area": topic_area,
        }

        return json.dumps(analysis, indent=2)
