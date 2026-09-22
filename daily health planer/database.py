import certifi
from pymongo import MongoClient

# Initialize the MongoClient globally so the connection pool is reused across requests
MONGO_URI = "mongodb+srv://shubhamgoeltps_db_user:Shubham786@schemesathi.1vdnaig.mongodb.net/?appName=SchemeSathi"
client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())

def get_db():
    return client.daily_life_manager
