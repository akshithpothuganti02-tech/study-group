from typing import List, Dict, Any
from datetime import datetime, timedelta

class TimeSlotGenerator:
    """
    TimeSlotGenerator Class
    Generates available time slots for study sessions based on a given date range,
    slot duration, and a list of already-booked sessions to avoid.
    """
    def __init__(self, slot_duration_minutes: int = 60, start_hour: int = 8, end_hour: int = 22):
        self.slot_duration_minutes = slot_duration_minutes
        self.start_hour = start_hour
        self.end_hour = end_hour

    def generate_day_slots(self, date_string: str) -> List[Dict[str, str]]:
        slots = []
        date = datetime.strptime(date_string, "%Y-%m-%d")

        for hour in range(self.start_hour, self.end_hour):
            for min_offset in range(0, 60, self.slot_duration_minutes):
                start = date.replace(hour=hour, minute=min_offset, second=0, microsecond=0)
                end = start + timedelta(minutes=self.slot_duration_minutes)

                if end.hour <= self.end_hour or (end.hour == self.end_hour and end.minute == 0):
                    slots.append({
                        "startTime": start.isoformat() + "Z", # Assuming UTC for simplicity
                        "endTime": end.isoformat() + "Z",
                        "label": self._format_slot_label(start, end)
                    })
        
        return slots

    def get_available_slots(self, date_string: str, booked_sessions: List[Dict[str, Any]] = None) -> List[Dict[str, str]]:
        if booked_sessions is None:
            booked_sessions = []
            
        all_slots = self.generate_day_slots(date_string)
        available = []

        for slot in all_slots:
            slot_start = datetime.fromisoformat(slot["startTime"].replace('Z', '+00:00')).timestamp()
            slot_end = datetime.fromisoformat(slot["endTime"].replace('Z', '+00:00')).timestamp()
            
            conflict = False
            for booked in booked_sessions:
                booked_start = datetime.fromisoformat(booked["startTime"].replace('Z', '+00:00')).timestamp()
                booked_end = datetime.fromisoformat(booked["endTime"].replace('Z', '+00:00')).timestamp()
                
                # Overlap occurs
                if slot_start < booked_end and booked_start < slot_end:
                    conflict = True
                    break
            
            if not conflict:
                available.append(slot)
                
        return available

    def get_weekly_available_slots(self, from_date: str, to_date: str, booked_sessions: List[Dict[str, Any]] = None) -> Dict[str, List[Dict[str, str]]]:
        result = {}
        current = datetime.strptime(from_date, "%Y-%m-%d")
        end = datetime.strptime(to_date, "%Y-%m-%d")

        while current <= end:
            date_str = current.strftime("%Y-%m-%d")
            result[date_str] = self.get_available_slots(date_str, booked_sessions)
            current += timedelta(days=1)

        return result

    def _format_slot_label(self, start: datetime, end: datetime) -> str:
        return f"{start.strftime('%I:%M %p')} - {end.strftime('%I:%M %p')}"

    def set_slot_duration(self, minutes: int):
        if minutes < 15 or minutes > 480:
            raise ValueError("Slot duration must be between 15 and 480 minutes")
        self.slot_duration_minutes = minutes
