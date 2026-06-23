"""
AgoraMind Fitness Agent
Evaluates overall student mastery and generates session summaries.
"""

import json

from .base import BaseAgent
from ..prompts import FITNESS_AGENT_PROMPT


class FitnessAgent(BaseAgent):
    """Agent that evaluates student progress and generates session fitness scores."""

    def __init__(self) -> None:
        super().__init__(FITNESS_AGENT_PROMPT)

    async def mock_response(self, messages: list[dict]) -> str:
        """Calculate a mastery score based on conversation patterns."""
        # Count student messages
        student_messages = [m for m in messages if m.get("role") == "user"]
        student_count = len(student_messages)

        # Analyze the quality of student responses
        total_words = 0
        reasoning_count = 0
        confusion_count = 0
        reasoning_keywords = [
            "because", "therefore", "since", "means", "so",
            "reason", "example", "shows", "leads to", "result",
        ]
        confusion_keywords = [
            "don't know", "not sure", "confused", "no idea",
            "help", "lost", "guess",
        ]

        for msg in student_messages:
            content = msg.get("content", "")
            content_lower = content.lower()
            total_words += len(content.split())
            reasoning_count += sum(1 for kw in reasoning_keywords if kw in content_lower)
            confusion_count += sum(1 for kw in confusion_keywords if kw in content_lower)

        # Calculate mastery score
        # Base score starts at 20 and increases with engagement
        base_score = 20
        engagement_bonus = min(student_count * 8, 30)  # Up to 30 from engagement
        quality_bonus = min(reasoning_count * 5, 25)    # Up to 25 from reasoning
        length_bonus = min(total_words // 10, 15)       # Up to 15 from thoroughness
        confusion_penalty = confusion_count * 8          # Penalty for confusion

        mastery_score = min(
            100,
            max(0, base_score + engagement_bonus + quality_bonus + length_bonus - confusion_penalty),
        )

        # Determine recommendation
        if mastery_score >= 80:
            recommendation = "mastered"
            summary = "The student demonstrates strong understanding and can articulate concepts clearly. Ready to advance."
        elif mastery_score >= 40:
            recommendation = "continue"
            summary = "The student is making solid progress and showing growing understanding. Continued practice recommended."
        else:
            recommendation = "review"
            summary = "The student would benefit from reviewing the fundamentals before moving to more advanced concepts."

        # Identify weak areas based on conversation topics
        weak_areas: list[dict] = []

        # Detect topic from conversation
        all_text = " ".join(m.get("content", "") for m in messages).lower()

        if any(kw in all_text for kw in ["math", "algebra", "equation", "calculus"]):
            topic = "Mathematics"
        elif any(kw in all_text for kw in ["physics", "chemistry", "biology", "science"]):
            topic = "Science"
        elif any(kw in all_text for kw in ["programming", "code", "python", "algorithm"]):
            topic = "Computer Science"
        elif any(kw in all_text for kw in ["history", "civilization", "war"]):
            topic = "History"
        else:
            topic = "General Studies"

        # Add weak areas if mastery is low
        if mastery_score < 60:
            weak_areas.append({
                "topic": topic,
                "concept": "Core concept understanding",
            })
        if confusion_count > 1:
            weak_areas.append({
                "topic": topic,
                "concept": "Applying reasoning to explain ideas",
            })

        fitness = {
            "mastery_score": mastery_score,
            "weak_areas": weak_areas,
            "recommendation": recommendation,
            "summary": summary,
        }

        return json.dumps(fitness, indent=2)
