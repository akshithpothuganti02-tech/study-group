from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime

class ScheduleManager:
    """
    ScheduleManager Class
    Handles all scheduling logic for study sessions including conflict detection,
    overlap calculation, and schedule validation.
    """
    def __init__(self, existing_sessions: Optional[List[Dict[str, Any]]] = None):
        self.sessions = existing_sessions if existing_sessions is not None else []

    def add_session(self, session: Dict[str, Any]):
        if "startTime" not in session or "endTime" not in session:
            raise ValueError("Session must have startTime and endTime")
        self.sessions.append(session)

    def has_conflict(self, session_a: Dict[str, Any], session_b: Dict[str, Any]) -> bool:
        start_a = datetime.fromisoformat(session_a["startTime"].replace('Z', '+00:00')).timestamp()
        end_a = datetime.fromisoformat(session_a["endTime"].replace('Z', '+00:00')).timestamp()
        start_b = datetime.fromisoformat(session_b["startTime"].replace('Z', '+00:00')).timestamp()
        end_b = datetime.fromisoformat(session_b["endTime"].replace('Z', '+00:00')).timestamp()

        # Overlap occurs when one session starts before the other ends
        return start_a < end_b and start_b < end_a

    def check_user_conflicts(self, new_session: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        user_sessions = [s for s in self.sessions if user_id in s.get("participants", [])]

        for existing in user_sessions:
            if self.has_conflict(new_session, existing):
                return {"hasConflict": True, "conflictingSession": existing}

        return {"hasConflict": False, "conflictingSession": None}

    def get_duration_minutes(self, session: Dict[str, Any]) -> int:
        start = datetime.fromisoformat(session["startTime"].replace('Z', '+00:00')).timestamp()
        end = datetime.fromisoformat(session["endTime"].replace('Z', '+00:00')).timestamp()
        return round((end - start) / 60)

    def validate_session(self, session: Dict[str, Any]) -> Dict[str, Any]:
        try:
            start = datetime.fromisoformat(session["startTime"].replace('Z', '+00:00'))
            end = datetime.fromisoformat(session["endTime"].replace('Z', '+00:00'))
        except ValueError:
            return {"valid": False, "error": "Invalid date format"}

        now = datetime.now(start.tzinfo)

        if start >= end:
            return {"valid": False, "error": "Start time must be before end time"}
        if start < now:
            return {"valid": False, "error": "Session cannot be scheduled in the past"}
        
        duration_minutes = self.get_duration_minutes(session)
        if duration_minutes < 15:
            return {"valid": False, "error": "Session must be at least 15 minutes long"}
        if duration_minutes > 480:
            return {"valid": False, "error": "Session cannot exceed 8 hours"}

        return {"valid": True, "error": None}

    def get_sessions_on_date(self, date_string: str) -> List[Dict[str, Any]]:
        result = []
        for session in self.sessions:
            session_date = datetime.fromisoformat(session["startTime"].replace('Z', '+00:00')).strftime("%Y-%m-%d")
            if session_date == date_string:
                result.append(session)
        return result

    def clear_sessions(self):
        self.sessions = []
