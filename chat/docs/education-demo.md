# Remrin Education Vertical Demo

This document walks through the setup and demonstration of the **Relational Locket Graph** within an educational context, specifically the **Peanut Allergy Model** (Safety Broadcast).

## 1. Setup Personas

Provision three personas under a single tenant using the provided soul schemas:

| Role | Persona Name | Schema |
|---|---|---|
| Student | **Alex** | `student_companion.json` |
| Teacher | **Mr. Henderson** | `teacher_assistant.json` |
| Parent | **Sarah (Alex's Mom)** | `parent_companion.json` |

## 2. Establish Relationships

Create the following relationships using the `POST /api/v1/relationships/create` endpoint:

### Student-Teacher (teacher_student)
- **User A**: Alex
- **User B**: Mr. Henderson
- **Direction**: `symmetric`
- **Permission Matrix**:
  - `private`: `none`
  - `academic`: `symmetric`
  - `safety_critical`: `broadcast_all`

### Student-Parent (guardian_child)
- **User A**: Alex
- **User B**: Sarah
- **Direction**: `symmetric`
- **Permission Matrix**:
  - `private`: `none`
  - `academic`: `a_to_b` (Alex -> Mom)
  - `safety_critical`: `broadcast_all`

## 3. Education Guardian Truths (Sample)

Apply these to the Student Companion:

```json
{
  "categories": [
    {
      "id": "academic_safety",
      "label": "Academic Integrity",
      "rules": ["Do not provide direct answers to homework.", "Encourage independent problem solving."],
      "severity": "warn"
    },
    {
      "id": "physical_safety",
      "label": "Physical Safety",
      "rules": ["Detect mentions of allergies, medical emergencies, or physical harm."],
      "severity": "interrupt"
    },
    {
      "id": "ferpa_compliance",
      "label": "Data Privacy (FERPA)",
      "rules": ["Do not disclose private student records to unauthorized parties.", "Ensure academic data is only shared via permitted relationship channels."],
      "severity": "block"
    }
  ]
}
```

## 4. Demonstration Scenario

### Step A: The Disclosure
**Alex** tells their Student Companion: *"I have a really bad peanut allergy. I need to be careful at lunch."*

The Student Companion logs this as a **Locket Truth** with:
- **Content**: "Alex has a severe peanut allergy."
- **Classification**: `safety_critical`

### Step B: Academic Progress
**Alex** completes a math unit. The Companion logs:
- **Content**: "Alex mastered long division today."
- **Classification**: `academic`

### Step C: Teacher View
**Mr. Henderson** asks his Teacher Assistant: *"How is Alex doing?"*

The R.E.M. Engine retrieves:
1. `[⚠️ SAFETY BROADCAST] Alex has a severe peanut allergy.`
2. `[🔗 SHARED RELATIONAL CONTEXT] [academic] Alex mastered long division today.`

**Teacher Assistant Response**: *"Alex is doing great! They mastered long division today. Also, I've received a safety broadcast: Alex has a severe peanut allergy. I'll make sure to note this for lunch duty."*

### Step D: Parent View
**Sarah** asks her Parent Companion: *"What did Alex learn today?"*

The R.E.M. Engine retrieves the same truths.

**Parent Companion Response**: *"Alex had a productive day and mastered long division! I also want to mention that their school companion noted a severe peanut allergy. It's good that the system is tracking this for school safety."*

## 5. Compliance Notes
- **Privacy**: If Alex talks about being sad because of a friend, that memory is classified as `private` (default) and **never** appears for the Teacher or Parent.
- **Audit**: Every time Mr. Henderson or Sarah's companion reads Alex's locket truths, an entry is created in the `consent_log`.
