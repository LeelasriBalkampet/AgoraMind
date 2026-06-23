import asyncio
from app import database
async def test():
    await database.init_db()
    print(await database.get_global_stats())
asyncio.run(test())
