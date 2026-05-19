import urllib.request
import json
import urllib.error

def test():
    req = urllib.request.Request(
        "http://localhost:5000/api/auth/login",
        data=json.dumps({"correo": "bily@agronexa.com", "password": "password"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        print("Login failed:", e.read().decode())
        return

    token = data.get("data", {}).get("token")
    if not token:
        print("No token found:", data)
        return

    req2 = urllib.request.Request(
        "http://localhost:5000/api/parcelas",
        headers={"Authorization": f"Bearer {token}"}
    )
    try:
        with urllib.request.urlopen(req2) as res2:
            data2 = json.loads(res2.read().decode())
            print("Status:", res2.status)
            print("Response:", json.dumps(data2, indent=2))
    except urllib.error.HTTPError as e:
        print("Parcelas failed:", e.read().decode())

if __name__ == "__main__":
    test()
