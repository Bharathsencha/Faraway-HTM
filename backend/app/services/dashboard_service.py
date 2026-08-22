from app.models.dashboard_model import find_profile_by_user_id, find_recent_sessions, record_game_session, serialize_dashboard_profile, upsert_profile
from app.models.user_model import find_user_by_id, serialize_user, update_user_profile
from app.services.db_service import get_db


def _build_games():
    return [
        {"title": "Coffee with Interview Arena", "detail": "Start with a calm conversational round built for warm-up practice.", "route": "/dashboard/game1", "icon": "book-open-check"},
        {"title": "Salary Negotiator Poker", "detail": "Learn salary negotiation in a poker-style game with resume-based salary guidance.", "route": "/dashboard/game2", "icon": "bar-chart-3"},
        {"title": "Articulate Master", "detail": "Sharpen clear answers, tighter structure, and polished interview delivery.", "route": "/game3/session", "icon": "brain"},
        {"title": "GOOGLY MASTER", "detail": "Read tricky questions, spot the trap, and lock in your confidence bet.", "route": "/game4/session", "icon": "gamepad-2"},
    ]


def _build_leaderboard(current_user_id: str, current_user_name: str, current_user_points: int, current_user_xp: int = 0, current_user_level: int = 1):
    db = get_db()
    users_collection = db["users"]
    profiles_collection = db["dashboard_profiles"]

    user_rows = list(users_collection.find({}, {"email": 1, "name": 1, "created_at": 1}))
    user_ids = [str(row["_id"]) for row in user_rows]
    profile_rows = list(profiles_collection.find({"user_id": {"$in": user_ids}}, {"user_id": 1, "xp": 1, "level": 1, "arena_points": 1, "completed_games": 1}))

    profile_map = {row["user_id"]: row for row in profile_rows}
    leaderboard_rows = []

    for user in user_rows:
        user_id = str(user["_id"])
        profile = profile_map.get(user_id, {})
        xp = int(profile.get("xp", 0) or 0)
        level = int(profile.get("level", 1) or 1)
        points = int(profile.get("arena_points", 0) or 0)
        completed_games = int(profile.get("completed_games", 0) or 0)
        name = (user.get("name") or user.get("email") or "Player").strip()
        leaderboard_rows.append(
            {
                "user_id": user_id,
                "name": name,
                "xp": xp,
                "level": level,
                "points": points,
                "completed_games": completed_games,
                "is_current_user": user_id == current_user_id,
            }
        )

    if current_user_id not in {row["user_id"] for row in leaderboard_rows}:
        leaderboard_rows.append(
            {
                "user_id": current_user_id,
                "name": current_user_name,
                "xp": current_user_xp,
                "level": current_user_level,
                "points": current_user_points,
                "completed_games": 0,
                "is_current_user": True,
            }
        )

    leaderboard_rows.sort(
        key=lambda row: (
            -int(row.get("xp", 0) or 0),
            -int(row.get("completed_games", 0) or 0),
            str(row.get("name", "")).lower(),
        )
    )

    ranked_rows = []
    current_rank = None
    for index, row in enumerate(leaderboard_rows[:10], start=1):
        ranked_row = {
            "rank": index,
            "name": row["name"],
            "xp": int(row["xp"]),
            "level": int(row["level"]),
            "points": int(row["points"]),
        }
        if row.get("is_current_user"):
            ranked_row["is_current_user"] = True
            current_rank = index
        ranked_rows.append(ranked_row)

    return ranked_rows, current_rank


def _normalize_profile_snapshot(profile_data: dict) -> dict:
    snapshot = dict(profile_data)
    if not snapshot.get("recent_sessions") and not snapshot.get("last_activity_at"):
        snapshot["streak_days"] = 0
        snapshot["arena_points"] = 0
        snapshot["completed_games"] = 0
        snapshot["weekly_progress"] = 0
        snapshot["focus_areas"] = snapshot.get("focus_areas") or snapshot.get("problems") or []
    return snapshot


def save_dashboard_profile(user_id: str, profile_data: dict):
    user_name = profile_data.get("name")
    if user_name is not None:
        update_user_profile(user_id, name=str(user_name))

    profile = upsert_profile(user_id, profile_data)
    return {
        "user": serialize_user(find_user_by_id(user_id)),
        "profile": _normalize_profile_snapshot(serialize_dashboard_profile(profile)),
    }


def get_dashboard_profile(user_id: str):
    profile = find_profile_by_user_id(user_id)
    if not profile:
        profile = upsert_profile(
            user_id,
            {
                "goal": "",
                "user_type": "",
                "problems": [],
            },
        )
    return _normalize_profile_snapshot(serialize_dashboard_profile(profile))


def get_dashboard_overview(user_id: str):
    user = find_user_by_id(user_id)
    if not user:
        return None

    profile = find_profile_by_user_id(user_id)
    if not profile:
        profile = upsert_profile(
            user_id,
            {
                "goal": "",
                "user_type": "",
                "problems": [],
            },
        )

    profile_data = _normalize_profile_snapshot(serialize_dashboard_profile(profile))
    user_data = serialize_user(user)

    focus_areas = profile_data["focus_areas"] or profile_data["problems"]
    current_points = profile_data["arena_points"]
    current_xp = profile_data.get("xp", 0)
    current_level = profile_data.get("level", 1)
    recent_sessions = find_recent_sessions(user_id, limit=5)

    if recent_sessions:
        next_session = []
        for item in recent_sessions[:3]:
            title = item.get("title") or "Recent session"
            summary = item.get("summary") or "Review your latest performance."
            next_session.append({"label": f"Review {title}", "detail": summary})
    else:
        next_session = [
            {"label": "Warm up", "detail": "Complete one focused session to establish a new baseline."},
            {"label": "Practice", "detail": "Work on your weakest focus area from onboarding."},
            {"label": "Review", "detail": "Check the latest feedback and adjust your next round."},
        ]

    leaderboard, current_rank = _build_leaderboard(user_id, user_data["name"], current_points, current_xp, current_level)

    profile_data["leaderboard_rank"] = current_rank or 0

    return {
        "user": {
            **user_data,
            "goal": profile_data["goal"],
            "user_type": profile_data["user_type"],
            "problems": focus_areas,
        },
        "stats": {
            "streak_days": profile_data["streak_days"],
            "arena_points": current_points,
            "focus_area_count": len(focus_areas),
            "completed_games": profile_data["completed_games"],
            "weekly_progress": profile_data["weekly_progress"],
        },
        "focus_areas": focus_areas,
        "next_session": next_session,
        "games": _build_games(),
        "leaderboard": leaderboard,
        "profile": profile_data,
    }


def record_activity(user_id: str, session_data: dict):
    # Calculate XP Awarded
    game_key = session_data.get("game_key", "")
    meta = session_data.get("gameplayMetadata", {})
    xp_awarded = 0

    if game_key == "game2":  # Salary Poker
        if meta.get("withdrawn") or meta.get("lost"):
            xp_awarded = 0
        else:
            if meta.get("countered_first"):
                xp_awarded += 50
            if meta.get("used_market_data"):
                xp_awarded += 75
            walk_aways = int(meta.get("bluff_master_count", 0))
            xp_awarded += walk_aways * 100
            if meta.get("never_settle_win"):
                xp_awarded += 200
            if meta.get("perfect_win"):
                xp_awarded += 300

    elif game_key == "game1":  # Coffee Game
        if meta.get("iron_nerve_complete"):
            xp_awarded += 100
        if meta.get("zero_fillers_opening"):
            xp_awarded += 50
        if meta.get("passed_resume_dive"):
            xp_awarded += 75
        
        verdict = meta.get("verdict", "")
        if verdict == "Clear":
            xp_awarded += 200
        elif verdict == "Borderline":
            xp_awarded += 75
        elif verdict == "Reject":
            xp_awarded += 25

    elif game_key == "game3":  # Articulate Master
        if meta.get("filler_slayer_complete"):
            xp_awarded += 100
        if meta.get("polished_speaker_win") or session_data.get("score", 0) > 80:
            xp_awarded += 75
        
        # Check if improved from last session
        db = get_db()
        sessions = list(db["dashboard_sessions"].find({"user_id": user_id, "game_key": "game3"}).sort("completed_at", -1).limit(1))
        if sessions:
            prev_score = sessions[0].get("score", 0)
            if session_data.get("score", 0) > prev_score:
                xp_awarded += 50
        
        # Streak check
        art_count = db["dashboard_sessions"].count_documents({"user_id": user_id, "game_key": "game3"})
        if (art_count + 1) % 5 == 0:
            xp_awarded += 150

    elif game_key == "game4":  # Googly Master
        under10s = int(meta.get("under10s_count", 0))
        xp_awarded += under10s * 50
        
        score = session_data.get("score", 50)
        if score > 80 or meta.get("googly_guru_win"):
            xp_awarded += 75
            
        if meta.get("three_in_a_row"):
            xp_awarded += 100

    session_data["xp_awarded"] = xp_awarded
    session_data["gameplay_metadata"] = meta

    profile = record_game_session(user_id, session_data)
    if not profile:
        return None

    # Retrieve attached values
    new_badges = profile.pop("_newly_earned_badges", [])
    xp_earned = profile.pop("_xp_awarded", 0)

    profile_snapshot = _normalize_profile_snapshot(serialize_dashboard_profile(profile))
    return {
        "profile": profile_snapshot,
        "xpAwarded": xp_earned,
        "badgesEarned": new_badges
    }


def update_dashboard_profile(user_id: str, profile_data: dict):
    return save_dashboard_profile(user_id, profile_data)
