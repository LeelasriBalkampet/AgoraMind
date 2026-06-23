import os
import asyncpg
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

pool = None

async def init_db() -> None:
    """Initialize the database connection pool."""
    global pool
    pool = await asyncpg.create_pool(DATABASE_URL)
    print(f"[DB] Connected to PostgreSQL pool")


async def create_student(student_id: str) -> None:
    """Create a new student record (ignored if already exists)."""
    async with pool.acquire() as db:
        await db.execute(
            "INSERT INTO students (id) VALUES ($1) ON CONFLICT DO NOTHING",
            student_id,
        )


async def create_session(student_id: str, topic: str = "") -> int:
    """Create a new tutoring session and return its ID."""
    async with pool.acquire() as db:
        session_id = await db.fetchval(
            "INSERT INTO sessions (student_id, topic) VALUES ($1, $2) RETURNING id",
            student_id, topic,
        )
        return session_id


async def end_session(session_id: int, mastery_score: int, summary: str = "", mentor: str = "Socrates") -> None:
    """End a session by setting the end time, mastery score, summary, and calculating duration."""
    async with pool.acquire() as db:
        await db.execute(
            """
            UPDATE sessions 
            SET end_time = CURRENT_TIMESTAMP, 
                mastery_score = $1,
                summary = $2,
                mentor = $3,
                duration_mins = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) / 60
            WHERE id = $4
            """,
            mastery_score, summary, mentor, session_id,
        )


async def add_message(session_id: int, role: str, content: str) -> None:
    """Add a message to a session's conversation history."""
    async with pool.acquire() as db:
        await db.execute(
            "INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)",
            session_id, role, content,
        )


async def get_session_messages(session_id: int) -> list[dict]:
    """Retrieve all messages for a given session, ordered by timestamp."""
    async with pool.acquire() as db:
        rows = await db.fetch(
            "SELECT id, session_id, role, content, timestamp FROM messages WHERE session_id = $1 ORDER BY timestamp ASC",
            session_id,
        )
        return [
            {
                "id": row["id"],
                "session_id": row["session_id"],
                "role": row["role"],
                "content": row["content"],
                "timestamp": row["timestamp"].isoformat() if row["timestamp"] else None,
            }
            for row in rows
        ]


async def get_student_stats(student_id: str) -> dict:
    """
    Get aggregate stats for a student for the websocket.
    Returns: {message_count, mastery_score (from latest session), session_count}
    """
    async with pool.acquire() as db:
        message_count = await db.fetchval(
            "SELECT COUNT(*) FROM messages m JOIN sessions s ON m.session_id = s.id WHERE s.student_id = $1",
            student_id,
        )

        session_count = await db.fetchval("SELECT COUNT(*) FROM sessions WHERE student_id = $1", student_id)

        mastery_score = await db.fetchval(
            "SELECT mastery_score FROM sessions WHERE student_id = $1 ORDER BY start_time DESC LIMIT 1",
            student_id,
        )

        return {
            "message_count": message_count or 0,
            "mastery_score": mastery_score or 0,
            "session_count": session_count or 0,
        }

async def get_dashboard_stats(student_id: str) -> dict:
    """Get full aggregate stats for the Learning Dashboard."""
    async with pool.acquire() as db:
        # Total XP (sum of all mastery scores)
        total_xp = await db.fetchval("SELECT SUM(mastery_score) FROM sessions WHERE student_id = $1", student_id)
        total_xp = total_xp or 0

        # Distinct topics studied
        topics_studied = await db.fetchval("SELECT COUNT(DISTINCT topic) FROM sessions WHERE student_id = $1 AND topic != ''", student_id)
        topics_studied = topics_studied or 0

        # Total sessions
        total_sessions = await db.fetchval("SELECT COUNT(id) FROM sessions WHERE student_id = $1", student_id)
        total_sessions = total_sessions or 0

        # Total time spent learning (sum of duration_mins)
        total_mins = await db.fetchval("SELECT SUM(duration_mins) FROM sessions WHERE student_id = $1", student_id)
        total_mins = total_mins or 0
        hours = total_mins // 60
        mins = total_mins % 60
        time_spent_str = f"{hours}h {mins}m" if hours > 0 else f"{mins}m"

        # Streak (consecutive days of sessions up to today/yesterday)
        rows = await db.fetch("SELECT DISTINCT DATE(start_time) as d FROM sessions WHERE student_id = $1 ORDER BY DATE(start_time) DESC", student_id)
        
        streak = 0
        if rows:
            today = datetime.utcnow().date()
            dates = [r["d"] for r in rows if r["d"]]
            
            if dates and (dates[0] == today or dates[0] == today - timedelta(days=1)):
                streak = 1
                curr_date = dates[0]
                for d in dates[1:]:
                    if d == curr_date - timedelta(days=1):
                        streak += 1
                        curr_date = d
                    else:
                        break

        return {
            "xp": total_xp,
            "topicsStudied": topics_studied,
            "totalSessions": total_sessions,
            "timeSpent": time_spent_str,
            "wisdomScore": min(100, max(0, int((total_xp / max((topics_studied * 100), 100)) * 100))), # Average mastery basically
            "streak": streak
        }

async def get_all_daily_progress(student_id: str) -> list[dict]:
    """Get all historical time spent aggregated by date."""
    async with pool.acquire() as db:
        rows = await db.fetch(
            """
            SELECT DATE(start_time) as d, SUM(duration_mins) as total_time 
            FROM sessions 
            WHERE student_id = $1
            GROUP BY DATE(start_time)
            ORDER BY DATE(start_time) DESC
            """,
            student_id
        )
        return [{"date": str(row["d"]), "time": int(row["total_time"] or 0)} for row in rows]

async def get_all_sessions(student_id: str) -> list[dict]:
    """Get all past sessions for a student, ordered by most recent."""
    async with pool.acquire() as db:
        rows = await db.fetch(
            """
            SELECT id, topic, start_time as date, 
                   duration_mins, mentor, summary, mastery_score 
            FROM sessions 
            WHERE student_id = $1 
            ORDER BY start_time DESC
            """,
            student_id
        )
        
        sessions = []
        for row in rows:
            session_id = row["id"]
            # Count questions asked by the student
            q_count = await db.fetchval("SELECT COUNT(*) FROM messages WHERE session_id = $1 AND role = 'student'", session_id)
            
            sessions.append({
                "id": session_id,
                "topic": row["topic"] or "General Discussion",
                "date": row["date"].isoformat() + "Z" if row["date"] else None,
                "duration": f"{row['duration_mins']} mins",
                "mentor": row["mentor"],
                "summary": row["summary"] or "No summary available for this session.",
                "questionsAsked": q_count or 0,
                "mastery_score": row["mastery_score"]
            })
        return sessions


async def upsert_weak_area(student_id: str, topic: str, concept: str) -> None:
    """Insert a new weak area or increment its frequency if it already exists."""
    async with pool.acquire() as db:
        existing = await db.fetchrow(
            "SELECT id, frequency FROM weak_areas WHERE student_id = $1 AND LOWER(topic) = LOWER($2)",
            student_id, topic,
        )

        if existing:
            await db.execute(
                "UPDATE weak_areas SET frequency = $1, last_seen = CURRENT_TIMESTAMP WHERE id = $2",
                existing["frequency"] + 1, existing["id"],
            )
        else:
            await db.execute(
                "INSERT INTO weak_areas (student_id, topic, concept) VALUES ($1, $2, $3)",
                student_id, topic, concept,
            )


async def get_weak_areas(student_id: str) -> list[dict]:
    """Get all weak areas for a student, ordered by frequency descending."""
    async with pool.acquire() as db:
        rows = await db.fetch(
            """
            SELECT MAX(id) as id, 
                   MAX(topic) as topic, 
                   MAX(concept) as concept, 
                   SUM(frequency) as frequency, 
                   MAX(last_seen) as last_seen
            FROM weak_areas
            WHERE student_id = $1
            GROUP BY LOWER(topic)
            ORDER BY frequency DESC
            """,
            student_id,
        )
        return [
            {
                "id": row["id"],
                "topic": row["topic"],
                "concept": row["concept"],
                "frequency": row["frequency"],
                "last_seen": row["last_seen"].isoformat() if row["last_seen"] else None,
            }
            for row in rows
        ]

async def get_global_stats() -> dict:
    """Get aggregated statistics across all users for the Admin Dashboard."""
    async with pool.acquire() as db:
        total_users = await db.fetchval("SELECT COUNT(id) FROM users")
        total_sessions = await db.fetchval("SELECT COUNT(id) FROM sessions")
        total_time_learnt = await db.fetchval("SELECT SUM(duration_mins) FROM sessions")

        rows = await db.fetch(
            """
            SELECT MAX(topic) as topic, MAX(concept) as concept, COUNT(DISTINCT student_id) as count 
            FROM weak_areas 
            GROUP BY LOWER(topic)
            ORDER BY count DESC 
            LIMIT 10
            """
        )
        weak_topics = [{"topic": r["topic"], "concept": r["concept"], "count": r["count"]} for r in rows]

        return {
            "total_users": total_users or 0,
            "total_sessions": total_sessions or 0,
            "total_time_learnt": total_time_learnt or 0,
            "weak_topics": weak_topics
        }

async def delete_session(session_id: int, student_id: str) -> bool:
    """Delete a session and all its messages."""
    async with pool.acquire() as db:
        exists = await db.fetchval("SELECT id FROM sessions WHERE id = $1 AND student_id = $2", session_id, student_id)
        if not exists:
            return False
            
        await db.execute("DELETE FROM messages WHERE session_id = $1", session_id)
        await db.execute("DELETE FROM sessions WHERE id = $1", session_id)
        return True

async def get_all_users_stats() -> list[dict]:
    """Get statistics for each individual user for the admin dashboard."""
    async with pool.acquire() as db:
        users = await db.fetch("SELECT username FROM users")
        
        users_stats = []
        for user in users:
            username = user["username"]
            
            s_row = await db.fetchrow("SELECT COUNT(id) as c, SUM(duration_mins) as t FROM sessions WHERE student_id = $1", username)
            total_sessions = s_row["c"] if s_row else 0
            total_time = s_row["t"] if s_row and s_row["t"] else 0
            
            hours = total_time // 60
            mins = total_time % 60
            time_str = f"{hours}h {mins}m" if hours > 0 else f"{mins}m"
            
            w_rows = await db.fetch(
                "SELECT MAX(topic) as topic, MAX(concept) as concept FROM weak_areas WHERE student_id = $1 GROUP BY LOWER(topic) ORDER BY MAX(frequency) DESC LIMIT 3", 
                username
            )
            weak_topics = [{"topic": r["topic"], "concept": r["concept"]} for r in w_rows]
            
            users_stats.append({
                "username": username,
                "total_sessions": total_sessions,
                "time_spent": time_str,
                "weak_topics": weak_topics
            })
            
        return users_stats
