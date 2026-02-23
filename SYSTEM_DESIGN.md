# IDPS Admission Test System Design

## 1. Grade Segmentation & 2. Subjects Configuration

| Section | Grades | Subjects |
| :--- | :--- | :--- |
| **Primary** | Grade 1–5 | English, Mathematics, EVS/General Science, Logical Reasoning |
| **Middle** | Grade 6–8 | English, Mathematics, Science, Social Science, Mental Ability |
| **Secondary** | Grade 9–10 | English, Mathematics, Science (Phy, Chem, Bio), Social Science, Aptitude |
| **Senior Secondary** | Grade 11–12 | **Science (PCM):** English, Physics, Chemistry, Maths, Aptitude<br>**Science (PCB):** English, Physics, Chemistry, Biology, Aptitude<br>**Commerce:** English, Accountancy, Business Studies, Economics, Aptitude<br>**Arts:** English, History, Political Science, Geography, Aptitude |

## 3. Exam Pattern Per Section

### Primary Section (Grade 1–5)
*   **Total Marks:** 50
*   **Duration:** 60 Minutes
*   **Structure:**
    *   English: 15 Questions (15 Marks)
    *   Maths: 15 Questions (15 Marks)
    *   EVS: 10 Questions (10 Marks)
    *   Reasoning: 10 Questions (10 Marks)
*   **Difficulty:** 60% Easy, 30% Moderate, 10% Hard
*   **Type:** 100% MCQ (Image-based for Grade 1-2)

### Middle Section (Grade 6–8)
*   **Total Marks:** 80
*   **Duration:** 90 Minutes
*   **Structure:**
    *   English: 20 Marks
    *   Maths: 25 Marks
    *   Science: 20 Marks
    *   Mental Ability: 15 Marks
*   **Difficulty:** 40% Easy, 40% Moderate, 20% Hard
*   **Type:** 80% MCQ, 20% Short Answer (One word/Fill in blanks)

### Secondary Section (Grade 9–10)
*   **Total Marks:** 100
*   **Duration:** 120 Minutes
*   **Structure:**
    *   English: 20 Marks
    *   Maths: 30 Marks
    *   Science: 30 Marks
    *   Social Science: 10 Marks
    *   Aptitude: 10 Marks
*   **Difficulty:** 30% Easy, 40% Moderate, 30% Hard

### Senior Secondary (Grade 11–12)
*   **Total Marks:** 100
*   **Duration:** 120 Minutes
*   **Stream Specifics:**
    *   **PCM:** Eng(20), Phy(25), Chem(25), Maths(30)
    *   **PCB:** Eng(20), Phy(25), Chem(25), Bio(30)
    *   **Commerce:** Eng(20), Accounts(30), Biz Studies(25), Econ(25)
    *   **Arts:** Eng(30), Social Sciences Mixed(50), Aptitude(20)

## 4. Marking Scheme
*   **Standard:** +1 for Correct, 0 for Incorrect/Unattempted.
*   **Negative Marking:** 
    *   Grade 1–8: No negative marking.
    *   Grade 9–12: -0.25 for incorrect MCQ answers.
*   **Passing Criteria:**
    *   Overall: 40%
    *   Sectional Cutoff (Grade 9+): 33% in each subject.

## 6. Evaluation System
*   **MCQ/Fill-ups:** Auto-evaluated by system.
*   **Descriptive (Future Scope):** Flagged for manual teacher review.
*   **Rank Logic:** 
    1.  Highest Total Marks
    2.  If tie, highest marks in Core Subject (Maths for PCM/Comm, Bio for PCB)
    3.  If tie, least negative marks.

## 7. Result Format (JSON Schema)

```json
{
  "examId": "EX-2026-001",
  "student": {
    "id": "ST-1023",
    "name": "Rahul Sharma",
    "gradeApplied": "11",
    "stream": "PCM"
  },
  "scoreCard": {
    "totalMarks": 100,
    "obtainedMarks": 78.5,
    "percentage": 78.5,
    "status": "PASS",
    "rank": 14,
    "percentile": 88.2,
    "sections": [
      {
        "subject": "Physics",
        "total": 25,
        "obtained": 18,
        "correct": 19,
        "incorrect": 4,
        "unattempted": 2
      },
      // ... other subjects
    ]
  },
  "feedback": "Strong in Physics concepts. Needs improvement in Calculus application."
}
```

## 8. System Architecture (Database Schema)

### Tables

1.  **`users`** (students)
    *   `id` (PK), `name`, `email`, `phone`, `dob`, `current_school`
2.  **`exams`** (configurations)
    *   `id` (PK), `grade`, `stream` (nullable), `total_marks`, `duration_mins`, `passing_pct`
3.  **`subjects`**
    *   `id` (PK), `name` (e.g., Physics, English)
4.  **`exam_subjects`** (mapping)
    *   `exam_id` (FK), `subject_id` (FK), `marks`, `question_count`
5.  **`questions`**
    *   `id` (PK), `subject_id` (FK), `grade_level`, `type` (MCQ/TEXT), `difficulty` (E/M/H), `content`, `image_url`, `options` (JSON), `correct_answer`
6.  **`exam_sets`**
    *   `id` (PK), `exam_id` (FK), `set_code` (A/B/C)
7.  **`exam_set_questions`**
    *   `set_id` (FK), `question_id` (FK), `sequence_order`
8.  **`student_attempts`**
    *   `id` (PK), `student_id` (FK), `exam_set_id` (FK), `start_time`, `end_time`, `score`, `status`
9.  **`student_answers`**
    *   `attempt_id` (FK), `question_id` (FK), `marked_option`, `is_correct`, `time_taken`

### Workflow
1.  **Admin:** Configures Exam Pattern (Grade -> Stream -> Subjects).
2.  **Admin:** Uploads Questions to Bank (tagged by Subject + Difficulty).
3.  **System:** Generates Exam Sets (randomized based on blueprint).
4.  **Student:** Registers -> Selects Grade/Stream -> Gets assigned a Set.
5.  **Exam:** JS Client handles timer/navigation. Submits answers payload.
6.  **Server:** Calculates Score -> Checks Cutoffs -> Generates Result JSON.
