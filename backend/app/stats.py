import json
from fastapi import APIRouter, HTTPException
from .database import (
    get_dashboard_stats,
    get_all_daily_progress,
    get_all_sessions,
    get_weak_areas,
    get_session_messages,
    delete_session as db_delete_session
)
from .agents.base import client, DEFAULT_MODEL, USE_MOCK

router = APIRouter(prefix="/api")

@router.get("/flashcards")
async def generate_flashcards(topic: str, concept: str):
    """Generate flashcards for a specific weak area."""
    if USE_MOCK:
        return {"flashcards": [
            {"question": f"What is a key principle of {concept} in {topic}?", "answer": "This is a mock answer."},
            {"question": "Can you explain how it works?", "answer": "This is a mock explanation."}
        ]}
    
    prompt = f"You are an expert tutor. Create 5 engaging flashcard questions and answers for a student who is struggling with the concept '{concept}' within the topic '{topic}'. Respond strictly in valid JSON format: [{{\"question\": \"...\", \"answer\": \"...\"}}]."
    
    try:
        response = await client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=800,
        )
        content = response.choices[0].message.content
        
        if content.startswith("```json"):
            content = content.split("```json")[1].split("```")[0].strip()
        elif content.startswith("```"):
            content = content.split("```")[1].split("```")[0].strip()
            
        cards = json.loads(content)
        return {"flashcards": cards}
    except Exception as e:
        print(f"Flashcard generation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate flashcards")

@router.get("/stats/{student_id}")
async def get_stats(student_id: str):
    """Get the full dashboard stats for the user."""
    dashboard = await get_dashboard_stats(student_id)
    historical_data = await get_all_daily_progress(student_id)
    weak_areas = await get_weak_areas(student_id)
    return {
        "stats": dashboard,
        "allHistoricalData": historical_data,
        "weakAreas": weak_areas
    }

@router.get("/sessions/{student_id}")
async def get_sessions(student_id: str):
    """Get the session history for the user."""
    sessions = await get_all_sessions(student_id)
    return {"sessions": sessions}

@router.get("/weak-areas/{student_id}")
async def get_areas(student_id: str):
    """Get all weak areas for the user."""
    areas = await get_weak_areas(student_id)
    return {"weakAreas": areas}

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: int, student_id: str):
    """Delete a specific session for a student."""
    success = await db_delete_session(session_id, student_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found or not owned by student")
    return {"status": "success"}

@router.get("/sessions/{session_id}/messages")
async def get_messages(session_id: int):
    """Get the message history for a specific session."""
    messages = await get_session_messages(session_id)
    return {"messages": messages}
