from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017')
db = client['agronexa_db']
users = list(db.users.find())
print("Users:", [(u.get('correo'), str(u.get('_id'))) for u in users])
parcelas = list(db.parcelas.find())
print("Parcelas:")
for p in parcelas:
    print(p)
