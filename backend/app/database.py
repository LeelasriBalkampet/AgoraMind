import aiosqlite
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "agoramind.db"


async def init_db() -> None:
    """Initialize the database and create all required tables."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS students (
                id TEXT PRIMARY KEY,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT,
                start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                end_time DATETIME,
                topic TEXT DEFAULT '',
                mastery_score INTEGER DEFAULT 0,
                FOREIGN KEY (student_id) REFERENCES students(id)
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER,
                role TEXT,
                content TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS weak_areas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT,
                topic TEXT,
                concept TEXT,
                frequency INTEGER DEFAULT 1,
                last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id)
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.commit()

        # Migrations
        try:
            await db.execute("ALTER TABLE sessions ADD COLUMN mentor TEXT DEFAULT 'Socrates'")
            await db.execute("ALTER TABLE sessions ADD COLUMN summary TEXT DEFAULT ''")
            await db.execute("ALTER TABLE sessions ADD COLUMN duration_mins INTEGER DEFAULT 0")
        except aiosqlite.OperationalError:
            pass # Columns already exist
        await db.commit()
    print(f"[DB] Database initialized at {DB_PATH}")


async def create_student(student_id: str) -> None:
    """Create a new student record (ignored if already exists)."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT OR IGNORE INTO students (id) VALUES (?)",
            (student_id,),
        )
        await db.commit()


async def create_session(student_id: str, topic: str = "") -> int:
    """Create a new tutoring session and return its ID."""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "INSERT INTO sessions (student_id, topic) VALUES (?, ?)",
            (student_id, topic),
        )
        await db.commit()
        return cursor.lastrowid


async def end_session(session_id: int, mastery_score: int, summary: str = "", mentor: str = "Socrates") -> None:
    """End a session by setting the end time, mastery score, summary, and calculating duration."""
    async with aiosqlite.connect(DB_PATH) as db:
        # Calculate duration in minutes (difference between start_time and CURRENT_TIMESTAMP)
        # SQLite's JULIANDAY returns fractional days. * 1440 converts to minutes.
        await db.execute(
            """
            UPDATE sessions 
            SET end_time = CURRENT_TIMESTAMP, 
                mastery_score = ?,
                summary = ?,
                mentor = ?,
                duration_mins = CAST((JULIANDAY(CURRENT_TIMESTAMP) - JULIANDAY(start_time)) * 1440 AS INTEGER)
            WHERE id = ?
            """,
            (mastery_score, summary, mentor, session_id),
        )
        await db.commit()


async def add_message(session_id: int, role: str, content: str) -> None:
    """Add a message to a session's conversation history."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)",
            (session_id, role, content),
        )
        await db.commit()


async def get_session_messages(session_id: int) -> list[dict]:
    """Retrieve all messages for a given session, ordered by timestamp."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT id, session_id, role, content, timestamp FROM messages WHERE session_id = ? ORDER BY timestamp ASC",
            (session_id,),
        )
        rows = await cursor.fetchall()
        return [
            {
                "id": row["id"],
                "session_id": row["session_id"],
                "role": row["role"],
                "content": row["content"],
                "timestamp": row["timestamp"],
            }
            for row in rows
        ]


async def get_student_stats(student_id: str) -> dict:
    """
    Get aggregate stats for a student for the websocket.
    Returns: {message_count, mastery_score (from latest session), session_count}
    """
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT COUNT(*) FROM messages m JOIN sessions s ON m.session_id = s.id WHERE s.student_id = ?",
            (student_id,),
        )
        row = await cursor.fetchone()
        message_count = row[0] if row else 0

        cursor = await db.execute("SELECT COUNT(*) FROM sessions WHERE student_id = ?", (student_id,))
        row = await cursor.fetchone()
        session_count = row[0] if row else 0

        cursor = await db.execute(
            "SELECT mastery_score FROM sessions WHERE student_id = ? ORDER BY start_time DESC LIMIT 1",
            (student_id,),
        )
        row = await cursor.fetchone()
        mastery_score = row[0] if row else 0

        return {
            "message_count": message_count,
            "mastery_score": mastery_score,
            "session_count": session_count,
        }

async def get_dashboard_stats(student_id: str) -> dict:
    """Get full aggregate stats for the Learning Dashboard."""
    async with aiosqlite.connect(DB_PATH) as db:
        # Total XP (sum of all mastery scores)
        cursor = await db.execute("SELECT SUM(mastery_score) FROM sessions WHERE student_id = ?", (student_id,))
        row = await cursor.fetchone()
        total_xp = row[0] if row and row[0] else 0

        # Distinct topics studied
        cursor = await db.execute("SELECT COUNT(DISTINCT topic) FROM sessions WHERE student_id = ? AND topic != ''", (student_id,))
        row = await cursor.fetchone()
        topics_studied = row[0] if row else 0

        # Total sessions
        cursor = await db.execute("SELECT COUNT(id) FROM sessions WHERE student_id = ?", (student_id,))
        row = await cursor.fetchone()
        total_sessions = row[0] if row else 0

        # Total time spent learning (sum of duration_mins)
        cursor = await db.execute("SELECT SUM(duration_mins) FROM sessions WHERE student_id = ?", (student_id,))
        row = await cursor.fetchone()
        total_mins = row[0] if row and row[0] else 0
        hours = total_mins // 60
        mins = total_mins % 60
        time_spent_str = f"{hours}h {mins}m" if hours > 0 else f"{mins}m"

        # Streak (consecutive days of sessions up to today/yesterday)
        cursor = await db.execute("SELECT DISTINCT date(start_time) FROM sessions WHERE student_id = ? ORDER BY date(start_time) DESC", (student_id,))
        rows = await cursor.fetchall()
        
        streak = 0
        if rows:
            from datetime import datetime, timedelta
            today = datetime.utcnow().date()
            dates = [datetime.strptime(r[0], "%Y-%m-%d").date() for r in rows]
            
            if dates[0] == today or dates[0] == today - timedelta(days=1):
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
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            """
            SELECT date(start_time) as d, SUM(duration_mins) as total_time 
            FROM sessions 
            WHERE student_id = ?
            GROUP BY d
            ORDER BY d DESC
            """,
            (student_id,)
        )
        rows = await cursor.fetchall()
        return [{"date": row["d"], "time": int(row["total_time"] or 0)} for row in rows]

async def get_all_sessions(student_id: str) -> list[dict]:
    """Get all past sessions for a student, ordered by most recent."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            """
            SELECT id, topic, replace(start_time, ' ', 'T') || 'Z' as date, 
                   duration_mins, mentor, summary, mastery_score 
            FROM sessions 
            WHERE student_id = ? 
            ORDER BY start_time DESC
            """,
            (student_id,)
        )
        rows = await cursor.fetchall()
        
        sessions = []
        for row in rows:
            session_id = row["id"]
            # Count questions asked by the student
            cursor2 = await db.execute("SELECT COUNT(*) FROM messages WHERE session_id = ? AND role = 'student'", (session_id,))
            q_row = await cursor2.fetchone()
            q_count = q_row[0] if q_row else 0
            
            sessions.append({
                "id": session_id,
                "topic": row["topic"] or "General Discussion",
                "date": row["date"],
                "duration": f"{row['duration_mins']} mins",
                "mentor": row["mentor"],
                "summary": row["summary"] or "No summary available for this session.",
                "questionsAsked": q_count,
                "mastery_score": row["mastery_score"]
            })
        return sessions


async def upsert_weak_area(student_id: str, topic: str, concept: str) -> None:
    """Insert a new weak area or increment its frequency if it already exists."""
    async with aiosqlite.connect(DB_PATH) as db:
        # Check if the weak area already exists
        cursor = await db.execute(
            "SELECT id, frequency FROM weak_areas WHERE student_id = ? AND topic = ? AND concept = ?",
            (student_id, topic, concept),
        )
        existing = await cursor.fetchone()

        if existing:
            await db.execute(
                "UPDATE weak_areas SET frequency = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?",
                (existing[1] + 1, existing[0]),
            )
        else:
            await db.execute(
                "INSERT INTO weak_areas (student_id, topic, concept) VALUES (?, ?, ?)",
                (student_id, topic, concept),
            )
        await db.commit()


async def get_weak_areas(student_id: str) -> list[dict]:
    """Get all weak areas for a student, ordered by frequency descending."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            """
            SELECT id, student_id, topic, concept, frequency, last_seen
            FROM weak_areas
            WHERE student_id = ?
            ORDER BY frequency DESC
            """,
            (student_id,),
        )
        rows = await cursor.fetchall()
        return [
            {
                "id": row["id"],
                "topic": row["topic"],
                "concept": row["concept"],
                "frequency": row["frequency"],
                "last_seen": row["last_seen"],
            }
            for row in rows
        ]

async def get_global_stats() -> dict:
    """Get aggregated statistics across all users for the Admin Dashboard."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        
        # Total users
        cursor = await db.execute("SELECT COUNT(id) FROM users")
        row = await cursor.fetchone()
        total_users = row[0] if row else 0

        # Total sessions
        cursor = await db.execute("SELECT COUNT(id) FROM sessions")
        row = await cursor.fetchone()
        total_sessions = row[0] if row else 0

        # Total time learnt
        cursor = await db.execute("SELECT SUM(duration_mins) FROM sessions")
        row = await cursor.fetchone()
        total_time_learnt = row[0] if row and row[0] else 0

        # Top 10 weak areas globally (grouped by topic)
        cursor = await db.execute(
            """
            SELECT MAX(topic) as topic, MAX(concept) as concept, COUNT(DISTINCT student_id) as count 
            FROM weak_areas 
            GROUP BY LOWER(topic)
            ORDER BY count DESC 
            LIMIT 10
            """
        )
        rows = await cursor.fetchall()
        weak_topics = [{"topic": r["topic"], "concept": r["concept"], "count": r["count"]} for r in rows]

        return {
            "total_users": total_users,
            "total_sessions": total_sessions,
            "total_time_learnt": total_time_learnt,
            "weak_topics": weak_topics
        }

async def delete_session(session_id: int, student_id: str) -> bool:
    """Delete a session and all its messages."""
    async with aiosqlite.connect(DB_PATH) as db:
        # First verify it belongs to this student
        cursor = await db.execute("SELECT id FROM sessions WHERE id = ? AND student_id = ?", (session_id, student_id))
        if not await cursor.fetchone():
            return False
            
        await db.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
        await db.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        await db.commit()
        return True

async def get_all_users_stats() -> list[dict]:
    """Get statistics for each individual user for the admin dashboard."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        
        cursor = await db.execute("SELECT username FROM users")
        users = await cursor.fetchall()
        
        users_stats = []
        for user in users:
            username = user["username"]
            
            # Sessions & Time
            s_cursor = await db.execute("SELECT COUNT(id) as c, SUM(duration_mins) as t FROM sessions WHERE student_id = ?", (username,))
            s_row = await s_cursor.fetchone()
            total_sessions = s_row["c"] if s_row else 0
            total_time = s_row["t"] if s_row and s_row["t"] else 0
            
            hours = total_time // 60
            mins = total_time % 60
            time_str = f"{hours}h {mins}m" if hours > 0 else f"{mins}m"
            
            # Weak topics
            w_cursor = await db.execute(
                "SELECT MAX(topic) as topic, MAX(concept) as concept FROM weak_areas WHERE student_id = ? GROUP BY LOWER(topic) ORDER BY MAX(frequency) DESC LIMIT 3", 
                (username,)
            )
            w_rows = await w_cursor.fetchall()
            weak_topics = [{"topic": r["topic"], "concept": r["concept"]} for r in w_rows]
            
            users_stats.append({
                "username": username,
                "total_sessions": total_sessions,
                "time_spent": time_str,
                "weak_topics": weak_topics
            })
            
        return users_stats
