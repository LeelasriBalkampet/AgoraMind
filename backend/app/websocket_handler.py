"""
AgoraMind WebSocket Handler
Core WebSocket endpoint for real-time Socratic tutoring conversations.
"""

import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from .database import (
    add_message,
    create_session,
    create_student,
    end_session,
    get_session_messages,
    get_student_stats,
    get_weak_areas,
    upsert_weak_area,
)
from .prompts import SOCRATIC_AGENT_PROMPT
from .agents.question import QuestionAgent
from .agents.analysis import AnalysisAgent
from .agents.socratic import SocraticAgent
from .agents.fitness import FitnessAgent

router = APIRouter()

question_agent = QuestionAgent()
analysis_agent = AnalysisAgent()
socratic_agent = SocraticAgent()
fitness_agent = FitnessAgent()

# Track active sessions: {student_id: session_id}
active_sessions: dict[str, int] = {}
# Track personalities for sessions: {session_id: personality_name}
active_personalities: dict[int, str] = {}


async def _get_stats(student_id: str) -> dict:
    """Get current stats for the student."""
    db_stats = await get_student_stats(student_id)
    weak_areas = await get_weak_areas(student_id)

    mastery = db_stats.get("mastery_score", 0)
    if mastery >= 80:
        recommendation = "Excellent! You're ready to advance to a new topic."
    elif mastery >= 40:
        recommendation = "Good progress! Keep exploring this topic."
    else:
        recommendation = "Let's keep working on the fundamentals."

    return {
        "message_count": db_stats.get("message_count", 0),
        "mastery_score": mastery,
        "weak_areas": weak_areas,
        "recommendation": recommendation,
    }


async def _finalize_session(student_id: str, session_id: int) -> None:
    """Run the fitness agent and close out the session."""
    messages = await get_session_messages(session_id)
    if len(messages) > 2:
        chat_history = [
            {
                "role": "user" if m["role"] == "student" else "assistant",
                "content": m["content"],
            }
            for m in messages
        ]
        fitness_raw = await fitness_agent.run(chat_history)
        
        # Clean up potential markdown formatting from LLM
        import re
        clean_json = fitness_raw.strip()
        match = re.search(r'\{.*\}', clean_json, re.DOTALL)
        if match:
            clean_json = match.group(0)

        try:
            fitness_data = json.loads(clean_json)
            mastery = fitness_data.get("mastery_score", 0)
            topic = fitness_data.get("topic", "General Discussion")
            strengths = fitness_data.get("strengths", [])
            needs_practice = fitness_data.get("needs_practice", [])
            next_topic = fitness_data.get("next_recommended_topic", "General Review")
            
            formatted_summary = f"Today's Session\n\nTopic:\n{topic}\n\nStrengths:\n"
            if strengths:
                for s in strengths:
                    formatted_summary += f"✔ {s}\n"
            else:
                formatted_summary += "None identified.\n"
                
            formatted_summary += "\nNeeds Practice:\n"
            if needs_practice:
                for p in needs_practice:
                    formatted_summary += f"⚠ {p}\n"
            else:
                formatted_summary += "None identified.\n"
                
            formatted_summary += f"\nNext Recommended Topic:\n{next_topic}"

            # Use active_personalities if tracked, otherwise default
            mentor = active_personalities.get(session_id, "Socrates")
            await end_session(session_id, mastery, formatted_summary.strip(), mentor)
            
            for area in fitness_data.get("weak_areas", []):
                await upsert_weak_area(
                    student_id,
                    area.get("topic", ""),
                    area.get("concept", ""),
                )
        except json.JSONDecodeError:
            mentor = active_personalities.get(session_id, "Socrates")
            await end_session(session_id, 0, "Failed to analyze session.", mentor)
    else:
        mentor = active_personalities.get(session_id, "Socrates")
        await end_session(session_id, 0, "Session was too short for analysis.", mentor)

    active_sessions.pop(student_id, None)
    active_personalities.pop(session_id, None)


async def _run_fitness_background(student_id: str, chat_history: list) -> None:
    """Run fitness agent in the background so it doesn't block the user's response."""
    fitness_raw = await fitness_agent.run(chat_history)
    import re
    clean_json = fitness_raw.strip()
    match = re.search(r'\{.*\}', clean_json, re.DOTALL)
    if match:
        clean_json = match.group(0)
    
    try:
        fitness_data = json.loads(clean_json)
        for area in fitness_data.get("weak_areas", []):
            await upsert_weak_area(
                student_id,
                area.get("topic", ""),
                area.get("concept", ""),
            )
    except json.JSONDecodeError:
        pass


@router.websocket("/ws/{student_id}")
async def websocket_endpoint(websocket: WebSocket, student_id: str, session_id: int = None) -> None:
    """Main WebSocket endpoint for a tutoring session."""
    await websocket.accept()

    # Setup: create student, create session
    await create_student(student_id)
    
    if session_id:
        active_sessions[student_id] = session_id
        # Fetch history
        history = await get_session_messages(session_id)
        formatted_history = []
        for msg in history:
            formatted_history.append({
                "id": msg["id"],
                "role": msg["role"],
                "content": msg["content"],
                "timestamp": msg["timestamp"]
            })
        await websocket.send_json({"type": "chat_history", "messages": formatted_history})
    else:
        session_id = await create_session(student_id)
        active_sessions[student_id] = session_id

        # Send greeting
        greeting = (
            "Welcome to AgoraMind.\n\n"
            "I am your Socratic mentor.\n"
            "Rather than providing answers directly, I will guide you through thoughtful questions that help you build understanding.\n\n"
            "What would you like to explore today?"
        )
        await add_message(session_id, "tutor", greeting)
        await websocket.send_json(
            {
                "type": "tutor_message",
                "content": greeting,
            }
        )

    try:
        while True:
            data = await websocket.receive_json()
            content = data.get("content", "")
            msg_type = data.get("type", "text")

            if not content.strip():
                continue

            # Store student message
            await add_message(session_id, "student", content)

            # Get conversation history for agents
            messages = await get_session_messages(session_id)
            chat_history = [
                {
                    "role": "user" if m["role"] == "student" else "assistant",
                    "content": m["content"],
                }
                for m in messages
            ]

            # Check if this is the first real response (topic selection)
            student_messages = [m for m in messages if m["role"] == "student"]

            if len(student_messages) == 1:
                # First response — generate initial question about the topic
                # Update session topic
                from . import database
                async with database.pool.acquire() as db:
                    await db.execute(
                        "UPDATE sessions SET topic = $1 WHERE id = $2",
                        content, session_id,
                    )

                question = await question_agent.run(chat_history)
                await add_message(session_id, "tutor", question)
            else:
                # Ongoing conversation — skip explicit analysis for low latency voice mode
                personality = data.get("personality", "Socrates")
                active_personalities[session_id] = personality
                from .prompts import PERSONALITY_INSTRUCTIONS
                personality_instruction = PERSONALITY_INSTRUCTIONS.get(
                    personality, PERSONALITY_INSTRUCTIONS["Socrates"]
                )

                # Generate next question directly
                merged_system_prompt = f"{SOCRATIC_AGENT_PROMPT}\n\nYour persona:\n{personality_instruction}\n\nAnalyze the student's last response internally for gaps, and ask your next question to target those gaps."
                question = await socratic_agent.run(chat_history, override_system_prompt=merged_system_prompt)
                await add_message(session_id, "tutor", question)

                # Every 4 student messages, run fitness agent in the background so it doesn't block the response!
                if len(student_messages) % 4 == 0:
                    asyncio.create_task(_run_fitness_background(student_id, chat_history))

            # Send response with stats
            stats = await _get_stats(student_id)
            await websocket.send_json(
                {
                    "type": "tutor_message",
                    "content": question,
                    "stats": stats,
                }
            )

    except WebSocketDisconnect:
        await _finalize_session(student_id, session_id)
    except Exception as e:
        print(f"WebSocket error for student {student_id}: {e}")
        await _finalize_session(student_id, session_id)
