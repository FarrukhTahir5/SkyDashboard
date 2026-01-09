
import asyncio
import httpx

async def test_endpoint():
    url = "http://localhost:8000/api/bugs/epic-stats"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=20.0)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print("Totals:", data.get("totals"))
                timeline = data.get("timeline", [])
                print(f"Timeline points: {len(timeline)}")
                if timeline:
                    print("First point:", timeline[0])
                    print("Last point:", timeline[-1])
            else:
                print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_endpoint())
