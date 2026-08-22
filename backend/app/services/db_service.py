import os

from pymongo import MongoClient

_client = None


def get_mongo_client() -> MongoClient:
    global _client
    if _client is None:
        mongo_uri = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
        if not mongo_uri:
            raise RuntimeError("MONGO_URI is not set")
        _client = MongoClient(mongo_uri)
    return _client


def get_db():
    client = get_mongo_client()
    db_name = os.getenv("MONGO_DB_NAME", "faraway_htm")
    return client[db_name]
