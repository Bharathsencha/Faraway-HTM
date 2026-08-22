from datetime import datetime

from bson import ObjectId

from app.services.db_service import get_db


def _users_collection():
    return get_db()["users"]


def serialize_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "created_at": user.get("created_at").isoformat() if user.get("created_at") else None,
        "updated_at": user.get("updated_at").isoformat() if user.get("updated_at") else None,
    }


def find_user_by_email(email: str):
    return _users_collection().find_one({"email": email.lower().strip()})


def find_user_by_id(user_id: str):
    try:
        return _users_collection().find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None


def create_user(email: str, name: str, password_hash: str):
    now = datetime.utcnow()
    result = _users_collection().insert_one(
        {
            "email": email.lower().strip(),
            "name": name.strip(),
            "password_hash": password_hash,
            "created_at": now,
            "updated_at": now,
        }
    )
    return find_user_by_id(str(result.inserted_id))


def update_user_profile(user_id: str, *, name: str | None = None):
    now = datetime.utcnow()
    updates = {"updated_at": now}
    if name is not None:
        updates["name"] = name.strip()

    _users_collection().update_one({"_id": ObjectId(user_id)}, {"$set": updates})
    return find_user_by_id(user_id)
