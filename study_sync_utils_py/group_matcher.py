from typing import List, Dict, Any, Optional

class GroupMatcher:
    """
    GroupMatcher Class
    Handles group-to-student compatibility scoring based on shared subjects,
    availability overlap, and group size constraints.
    """
    def __init__(self, groups: Optional[List[Dict[str, Any]]] = None):
        self.groups = groups if groups is not None else []

    def calculate_compatibility_score(self, user: Dict[str, Any], group: Dict[str, Any]) -> int:
        score = 0.0

        # Subject overlap contributes up to 60 points
        user_subjects = [s.lower() for s in user.get("subjects", [])]
        group_subjects = [s.lower() for s in group.get("subjects", [])]
        shared_subjects = [s for s in user_subjects if s in group_subjects]

        if group_subjects:
            subject_score = (len(shared_subjects) / len(group_subjects)) * 60
            score += subject_score

        # Availability overlap contributes up to 30 points
        user_availability = user.get("availability", [])
        group_availability = group.get("preferredTimes", [])
        if group_availability:
            shared_slots = [slot for slot in user_availability if slot in group_availability]
            avail_score = (len(shared_slots) / len(group_availability)) * 30
            score += avail_score

        # Group has open spots contributes 10 points
        current_size = len(group.get("members", []))
        max_size = group.get("maxSize", 10)
        if current_size < max_size:
            score += 10

        return round(score)

    def find_best_matches(self, user: Dict[str, Any], top_n: int = 5) -> List[Dict[str, Any]]:
        scored = []
        for group in self.groups:
            # Exclude full groups
            current_size = len(group.get("members", []))
            if current_size >= group.get("maxSize", 10):
                continue
            
            score = self.calculate_compatibility_score(user, group)
            if score > 0:
                scored.append({
                    "group": group,
                    "score": score
                })
        
        # Sort by score descending
        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_n]

    def filter_by_subjects(self, subjects: List[str]) -> List[Dict[str, Any]]:
        normalized = [s.lower() for s in subjects]
        filtered_groups = []
        for group in self.groups:
            group_subjects = [s.lower() for s in group.get("subjects", [])]
            if any(s in normalized for s in group_subjects):
                filtered_groups.append(group)
        return filtered_groups

    def group_by_subject(self) -> Dict[str, List[Dict[str, Any]]]:
        result = {}
        for group in self.groups:
            for subject in group.get("subjects", []):
                key = subject.lower()
                if key not in result:
                    result[key] = []
                result[key].append(group)
        return result

    def set_groups(self, groups: List[Dict[str, Any]]):
        self.groups = groups
