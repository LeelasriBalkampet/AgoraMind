import sqlite3
import psycopg2
import sys

PG_URL = "postgresql://neondb_owner:npg_MY2dXHza8tJp@ep-floral-term-ao0mebu2.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def migrate():
    sl_conn = sqlite3.connect("C:/Users/leela/Desktop/AgoraMind/backend/agoramind.db")
    sl_conn.row_factory = dict_factory
    sl_cur = sl_conn.cursor()

    try:
        pg_conn = psycopg2.connect(PG_URL)
        pg_cur = pg_conn.cursor()
    except Exception as e:
        print("Failed to connect to Postgres:", e)
        return

    pg_cur.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id TEXT PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS sessions (
            id SERIAL PRIMARY KEY,
            student_id TEXT REFERENCES students(id),
            start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            end_time TIMESTAMP,
            topic TEXT DEFAULT '',
            mastery_score INTEGER DEFAULT 0,
            mentor TEXT DEFAULT 'Socrates',
            summary TEXT DEFAULT '',
            duration_mins INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
            role TEXT,
            content TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS weak_areas (
            id SERIAL PRIMARY KEY,
            student_id TEXT REFERENCES students(id),
            topic TEXT,
            concept TEXT,
            frequency INTEGER DEFAULT 1,
            last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    pg_conn.commit()

    # 4. Copy Users
    sl_cur.execute("SELECT * FROM users")
    users = sl_cur.fetchall()
    for u in users:
        pg_cur.execute(
            "INSERT INTO users (id, username, email, password_hash, created_at) VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING",
            (u['id'], u['username'], u['email'], u['password_hash'], u['created_at'])
        )
    print(f"Copied {len(users)} users.")

    # 5. Copy Students
    sl_cur.execute("SELECT * FROM students")
    students = sl_cur.fetchall()
    for s in students:
        pg_cur.execute(
            "INSERT INTO students (id, created_at) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (s['id'], s['created_at'])
        )
    print(f"Copied {len(students)} students.")

    # 6. Copy Sessions
    sl_cur.execute("SELECT * FROM sessions")
    sessions = sl_cur.fetchall()
    for s in sessions:
        pg_cur.execute(
            "INSERT INTO sessions (id, student_id, start_time, end_time, topic, mastery_score, mentor, summary, duration_mins) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING",
            (s['id'], s['student_id'], s['start_time'], s['end_time'], s['topic'], s['mastery_score'], s.get('mentor', 'Socrates'), s.get('summary', ''), s.get('duration_mins', 0))
        )
    print(f"Copied {len(sessions)} sessions.")
    
    # 7. Copy Messages
    sl_cur.execute("SELECT * FROM messages")
    messages = sl_cur.fetchall()
    for m in messages:
        pg_cur.execute(
            "INSERT INTO messages (id, session_id, role, content, timestamp) VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING",
            (m['id'], m['session_id'], m['role'], m['content'], m['timestamp'])
        )
    print(f"Copied {len(messages)} messages.")

    # 8. Copy Weak Areas
    sl_cur.execute("SELECT * FROM weak_areas")
    weak_areas = sl_cur.fetchall()
    for w in weak_areas:
        pg_cur.execute(
            "INSERT INTO weak_areas (id, student_id, topic, concept, frequency, last_seen) VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING",
            (w['id'], w['student_id'], w['topic'], w['concept'], w['frequency'], w['last_seen'])
        )
    print(f"Copied {len(weak_areas)} weak areas.")

    # Fix sequences
    pg_cur.execute("SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));")
    pg_cur.execute("SELECT setval('sessions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM sessions));")
    pg_cur.execute("SELECT setval('messages_id_seq', (SELECT COALESCE(MAX(id), 1) FROM messages));")
    pg_cur.execute("SELECT setval('weak_areas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM weak_areas));")

    pg_conn.commit()
    print("Migration Complete!")

if __name__ == "__main__":
    migrate()
