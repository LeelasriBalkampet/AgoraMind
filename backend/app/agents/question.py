"""
AgoraMind Question Agent
Generates initial probing questions about the student's chosen topic.
"""

import random

from .base import BaseAgent
from ..prompts import QUESTION_AGENT_PROMPT

# Topic-aware mock questions for demo mode
MOCK_QUESTIONS: dict[str, list[str]] = {
    "math": [
        "Before we dive in, can you explain what it means for two quantities to be proportional to each other? How would you recognize that relationship?",
        "Let's start with a fundamental question: what does it actually mean to 'solve' an equation? What are you really looking for?",
        "Here's something to think about: why do we need negative numbers? Can you describe a real-world situation where they're essential?",
        "What's the difference between an expression and an equation? Why does that distinction matter?",
    ],
    "science": [
        "Let's begin here: what do you think would happen if gravity suddenly stopped working? What does that tell you about gravity's role?",
        "Can you explain the difference between speed and velocity? When does the distinction actually matter?",
        "Why do you think ice floats on water instead of sinking? What property of water makes this possible?",
        "If energy can't be created or destroyed, where does the energy from your breakfast 'go' throughout the day?",
    ],
    "programming": [
        "What's the fundamental difference between a variable and a constant? Why would a programmer choose one over the other?",
        "Can you explain what happens step-by-step when a computer runs a loop? What decides when it stops?",
        "Why do we need different data types in programming? Why not just store everything as text?",
        "What problem does a function solve in code? Why not just write all the instructions in one long sequence?",
    ],
    "history": [
        "What do you think causes civilizations to rise and fall? Can you identify any common patterns?",
        "Why do you think the invention of writing was so transformative for human societies? What changed?",
        "How do you think geography influenced which regions developed certain technologies first?",
        "What's the difference between a primary source and a secondary source? Why should historians care?",
    ],
    "general": [
        "That's a great topic! Let me start by asking: what do you already know about this subject? What's one thing you're confident about?",
        "Interesting choice! Before we go deeper, can you describe this topic in your own words — what is it fundamentally about?",
        "Great! Let's test your foundations: what do you think is the most important concept or idea in this area, and why?",
        "I'd love to explore that with you. To start, what first got you curious about this topic? What questions do you already have?",
        "Let's begin with the basics: if you had to explain this topic to a friend who's never heard of it, what would you say?",
        "Good choice! What do you think is the biggest misconception people have about this topic?",
    ],
}

# Keywords used to detect the topic category
TOPIC_KEYWORDS: dict[str, list[str]] = {
    "math": [
        "math", "algebra", "calculus", "geometry", "equation", "number",
        "arithmetic", "fraction", "trigonometry", "statistics", "probability",
        "linear", "quadratic", "derivative", "integral", "matrix",
    ],
    "science": [
        "science", "physics", "chemistry", "biology", "atom", "cell",
        "energy", "force", "gravity", "evolution", "dna", "molecule",
        "experiment", "hypothesis", "element", "reaction", "ecosystem",
    ],
    "programming": [
        "programming", "coding", "python", "javascript", "java", "code",
        "algorithm", "function", "variable", "loop", "array", "database",
        "software", "web", "api", "html", "css", "react", "sql", "git",
    ],
    "history": [
        "history", "war", "civilization", "empire", "revolution", "ancient",
        "medieval", "century", "dynasty", "colony", "independence",
        "renaissance", "industrial", "democracy", "constitution",
    ],
}


class QuestionAgent(BaseAgent):
    """Agent that generates initial probing questions for a topic."""

    def __init__(self) -> None:
        super().__init__(QUESTION_AGENT_PROMPT)

    def _detect_category(self, text: str) -> str:
        """Detect the topic category from the user's text."""
        text_lower = text.lower()
        scores: dict[str, int] = {}

        for category, keywords in TOPIC_KEYWORDS.items():
            scores[category] = sum(1 for kw in keywords if kw in text_lower)

        best = max(scores, key=scores.get)
        return best if scores[best] > 0 else "general"

    async def mock_response(self, messages: list[dict]) -> str:
        """Return a topic-relevant probing question."""
        # Find the last user message to determine the topic
        last_user_msg = ""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                last_user_msg = msg.get("content", "")
                break

        category = self._detect_category(last_user_msg)
        questions = MOCK_QUESTIONS.get(category, MOCK_QUESTIONS["general"])
        return random.choice(questions)
