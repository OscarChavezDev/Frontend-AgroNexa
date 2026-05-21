from pymongo import MongoClient
import bcrypt

client = MongoClient('mongodb://localhost:27017')
db = client['agronexa_db']

# Generate bcrypt hash of "password"
password_hash = bcrypt.hashpw(b"password", bcrypt.gensalt()).decode("utf-8")

# Update user "bily@gmail.com" password
res = db.users.update_one(
    {"correo": "bily@gmail.com"},
    {"$set": {"password": password_hash}}
)
print("Updated count:", res.modified_count)

users = list(db.users.find())
print("Users:", [(u.get('correo'), str(u.get('_id'))) for u in users])
