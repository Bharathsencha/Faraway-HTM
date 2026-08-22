import bcrypt
from flask_jwt_extended import create_access_token

from app.models.user_model import (
    create_user,
    find_user_by_email,
    find_user_by_id,
    serialize_user,
)


def _hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def _verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def register_user(email: str, name: str, password: str):
    existing_user = find_user_by_email(email)
    if existing_user:
        return None, "Email already registered."

    user = create_user(email=email, name=name, password_hash=_hash_password(password))
    access_token = create_access_token(identity=str(user["_id"]))
    return {
        "user": serialize_user(user),
        "access_token": access_token,
    }, None


def login_user(email: str, password: str):
    user = find_user_by_email(email)
    if not user:
        return None, "Invalid email or password."

    if not _verify_password(password, user["password_hash"]):
        return None, "Invalid email or password."

    access_token = create_access_token(identity=str(user["_id"]))
    return {
        "user": serialize_user(user),
        "access_token": access_token,
    }, None


def get_current_user(user_id: str):
    user = find_user_by_id(user_id)
    if not user:
        return None
    return serialize_user(user)
