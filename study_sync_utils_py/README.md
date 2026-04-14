# Study Sync Utils
A Python utility library for the StudySync application handling advanced grouping algorithms, schedule checking, and dynamic time-slot generation.

## Features
- **Group Matching**: Compare student availability against existing study groups and score compatibility dynamically based on shared subjects and free slots.
- **Schedule Management**: Validate new study sessions against active overlaps and duration constraints (15 minutes to 8 hours).
- **Time Slot Generator**: Generates clean, available slots based on dynamic daily windows while factoring out pre-booked overlapping sessions.

## Installation
```bash
pip install study-sync-utils
```

## Basic Usage

### Group Matcher
```python
from study_sync_utils import GroupMatcher

matcher = GroupMatcher(groups=[
    {"subjects": ["Math", "Physics"], "preferredTimes": ["10:00 AM"], "maxSize": 5, "members": []}
])

score = matcher.calculate_compatibility_score(
    user={"subjects": ["Math"], "availability": ["10:00 AM"]},
    group=matcher.groups[0]
)
print("Compatibility Score:", score)
```
