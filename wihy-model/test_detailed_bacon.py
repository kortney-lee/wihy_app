import requests
import json

def test_bacon_detailed():
    """Detailed bacon testing"""
    base_url = "http://localhost:8000"
    
    print("🥓 Detailed Bacon Testing")
    print("=" * 50)
    
    # 1. Search bacon (before DB population)
    print("1. 🔍 Search bacon (before database)...")
    try:
        response = requests.get(f"{base_url}/api/nutrition/search?product=bacon")
        data = response.json()
        print(f"   Status: {response.status_code}")
        print(f"   Mode: {data.get('mode', 'unknown')}")
        print(f"   Results count: {data.get('count', 0)}")
        if data.get('results'):
            print(f"   First result: {data['results'][0].get('product_name', 'N/A')}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # 2. Populate database
    print("\n2. 💾 Populating database...")
    try:
        response = requests.post(f"{base_url}/api/nutrition/populate-bacon")
        data = response.json()
        print(f"   Status: {response.status_code}")
        print(f"   Message: {data.get('message', 'N/A')}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # 3. Search bacon (after DB population)
    print("\n3. 🔍 Search bacon (after database)...")
    try:
        response = requests.get(f"{base_url}/api/nutrition/search?product=bacon")
        data = response.json()
        print(f"   Status: {response.status_code}")
        print(f"   Mode: {data.get('mode', 'unknown')}")
        print(f"   Results count: {data.get('count', 0)}")
        if data.get('results'):
            result = data['results'][0]
            print(f"   Product: {result.get('product_name', 'N/A')}")
            nutrition = result.get('nutrition', {})
            print(f"   Calories: {nutrition.get('energy_kcal', 'N/A')}")
            print(f"   Protein: {nutrition.get('proteins_g', 'N/A')}g")
            print(f"   Sodium: {nutrition.get('sodium_mg', 'N/A')}mg")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # 4. Full analysis
    print("\n4. 🧠 Full ML analysis...")
    analysis_payload = {
        "product_name": "bacon",
        "user_context": "weight_loss",
        "user_metrics": {
            "daily_calories": 1800,
            "current_weight": 70,
            "goal_weight": 65
        }
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/nutrition/analyze",
            json=analysis_payload
        )
        data = response.json()
        print(f"   Status: {response.status_code}")
        print(f"   Mode: {data.get('mode', 'unknown')}")
        print(f"   Nourish Score: {data.get('nourish_score', {}).get('score', 'N/A')}")
        print(f"   Label: {data.get('nourish_score', {}).get('label', 'N/A')}")
        
        advice = data.get('lifestyle_advice', {})
        tips = advice.get('actionable_tips', [])
        if tips:
            print(f"   First tip: {tips[0]}")
        
        print(f"   Verification source: {data.get('verification', {}).get('source', 'N/A')}")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # 5. Ask AI
    print("\n5. 🤖 Ask AI about bacon...")
    try:
        response = requests.get(f"{base_url}/ask?q=Is bacon healthy for weight loss")
        data = response.json()
        print(f"   Status: {response.status_code}")
        print(f"   Product score: {data.get('product', {}).get('score', 'N/A')}")
        answer = data.get('answer', '')
        print(f"   Answer preview: {answer[:100]}...")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    test_bacon_detailed()