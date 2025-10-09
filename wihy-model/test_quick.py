import requests
import json
import time

def test_api_quickly():
    """Quick API functionality test"""
    base_url = "http://localhost:8000"
    
    # First check if API is running
    print("🧪 Quick API Tests")
    print("=" * 50)
    print("🔍 Checking if API is running...")
    
    try:
        response = requests.get(f"{base_url}/", timeout=3)
        print("✅ API is responding!")
    except requests.exceptions.ConnectionError:
        print("❌ API is not running!")
        print("💡 Start the API first with:")
        print("   uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload")
        return
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return
    
    print("=" * 50)
    
    tests = [
        ("Root", "GET", "/"),
        ("Health", "GET", "/healthz"), 
        ("Ask Basic", "GET", "/ask?q=bacon"),
        ("Ask Empty", "GET", "/ask?q="),
        ("Search", "GET", "/api/nutrition/search?product=bacon"),
        ("Populate DB", "POST", "/api/nutrition/populate-bacon"),
        ("Search After", "GET", "/api/nutrition/search?product=bacon"),
        ("Docs", "GET", "/docs"),
    ]
    
    for name, method, endpoint in tests:
        try:
            url = f"{base_url}{endpoint}"
            
            if method == "GET":
                response = requests.get(url, timeout=5)
            elif method == "POST":
                response = requests.post(url, timeout=5)
            
            status = "✅ PASS" if response.status_code == 200 else f"❌ FAIL ({response.status_code})"
            
            # Show mode for key endpoints
            if response.status_code == 200 and endpoint in ["/healthz", "/api/nutrition/search?product=bacon"]:
                try:
                    data = response.json()
                    mode = data.get('mode', 'unknown')
                    status += f" [{mode}]"
                except:
                    pass
            
            print(f"{name:15} {status}")
            
            if response.status_code not in [200, 422]:  # 422 is OK for validation errors
                print(f"    Error: {response.text[:100]}")
                
        except requests.exceptions.Timeout:
            print(f"{name:15} ❌ TIMEOUT")
        except requests.exceptions.ConnectionError:
            print(f"{name:15} ❌ CONNECTION ERROR")
        except Exception as e:
            print(f"{name:15} ❌ ERROR: {str(e)[:50]}")
        
        # Small delay between requests
        time.sleep(0.1)
    
    print("=" * 50)
    print("💡 Tip: Visit http://localhost:8000/docs for interactive API documentation")

def test_analysis_endpoint():
    """Test the analysis endpoint specifically"""
    base_url = "http://localhost:8000"
    
    print("\n🔬 Testing Analysis Endpoint")
    print("=" * 30)
    
    analysis_payload = {
        "product_name": "bacon",
        "user_context": "weight_loss",
        "user_metrics": {
            "daily_calories": 1800
        }
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/nutrition/analyze",
            json=analysis_payload,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            mode = data.get('mode', 'unknown')
            score = data.get('nourish_score', {}).get('score', 'N/A')
            print(f"✅ Analysis: SUCCESS [{mode}] Score: {score}")
        else:
            print(f"❌ Analysis: FAILED ({response.status_code})")
            print(f"   Error: {response.text[:100]}")
            
    except Exception as e:
        print(f"❌ Analysis: ERROR - {e}")

if __name__ == "__main__":
    test_api_quickly()
    test_analysis_endpoint()