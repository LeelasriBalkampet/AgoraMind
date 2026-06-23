import sqlite3
from datetime import datetime, timedelta

db = sqlite3.connect('agoramind.db')
cursor = db.cursor()
cursor.execute('SELECT DISTINCT date(start_time) FROM sessions ORDER BY date(start_time) DESC')
rows = cursor.fetchall()
print('ROWS:', rows)

streak = 0
if rows:
    today = datetime.utcnow().date()
    print('TODAY:', today)
    dates = [datetime.strptime(r[0], '%Y-%m-%d').date() for r in rows if r[0]]
    print('DATES:', dates)
    
    if dates:
        if dates[0] == today or dates[0] == today - timedelta(days=1):
            streak = 1
            curr_date = dates[0]
            for d in dates[1:]:
                if d == curr_date - timedelta(days=1):
                    streak += 1
                    curr_date = d
                else:
                    break
print('STREAK:', streak)
