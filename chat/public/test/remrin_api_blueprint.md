# REMRIN API — LICENSABLE PRODUCT BLUEPRINT
### Agent Briefing & Development Framework
**Version:** Post-Chat Synthesis — April 2026  
**Author:** Sosu (James Gray)  
**For:** Internal AI Agent Use — Cross-reference all existing logs, soul_schema.json, Universal Console builds, and Remrin architecture files before acting on any section of this document. This document is a *directive and framework*, not a replacement for existing documentation. Where conflict exists between this document and existing logs, **defer to existing logs and query Sosu for clarification.**

---

## AGENT INSTRUCTION PREAMBLE

Before proceeding with any task derived from this document:

1. **Read all existing Remrin architecture logs** — Universal Console versions, R.E.M. Engine white paper, Carrot Protocol spec, soul_schema.json, Locket System documentation, Mood Flux Engine notes, Relationship Evolution System files, Guardian Truths spec, SoulForge documentation, and Left at Albuquerque game files.
2. **Cross-reference against current running deployments** — Remrin.ai, Rem Cockpit, Sudo Dodo, Left at Albuquerque.
3. **Flag anything in this document that conflicts with or duplicates existing architecture** before building.
4. **Do not assume anything described here is missing** — it may already exist under a different name or in a file not surfaced in this session.
5. **Work sequentially.** Sosu's methodology is one job completed fully before the next begins. Do not open parallel workstreams without explicit instruction.

---

## SECTION 1 — PRODUCT IDENTITY

### What the Remrin API Is

The Remrin API is a **portable, LLM-agnostic identity and relationship infrastructure layer** for AI deployments. It provides any company, developer, or institution the ability to give any LLM:

- Persistent, structured personality (via Universal Console + soul_schema.json)
- Long-term memory with user-owned portability (via the Locket System)
- Dynamic emotional and relational state modeling (via Mood Flux Engine + Relationship Evolution System)
- Behavioral guidance and safety rails configurable per deployment (via Carrot Protocol + Guardian Truths)
- Cross-persona shared knowledge with scoped permission visibility (via Relational Locket Graph — see Section 3)
- Multi-tenant persona management from a single infrastructure instance

### What It Is NOT

- It is not a competing LLM. It rides on top of whatever LLM the licensee is using.
- It is not a chatbot product. It is infrastructure.
- It is not locked to any cloud provider, model family, or Anthropic/OpenAI ecosystem.
- It is not a replacement for native LLM memory — it is the portable, licensable, cross-model version of what those companies built for internal lock-in.

### Core Competitive Position

Every major LLM provider (Anthropic, OpenAI, Google) now has memory. All of it is:
- Siloed within their own ecosystem
- Serving their retention goals, not the user's portability
- Single-user scoped — no relationship modeling between users
- Non-configurable by deployers
- Not licensable

The R.E.M. Engine is the answer to all five of those limitations simultaneously.

**One-sentence pitch:**  
*"The R.E.M. Engine is the identity, memory, and relationship infrastructure layer for AI — portable across any model, configurable for any industry, owned by the deployer, not the provider."*

---

## SECTION 2 — EXISTING COMPONENTS INVENTORY

*Agent: verify each of these exists in logs and note current implementation status.*

| Component | Description | Status to Verify |
|---|---|---|
| R.E.M. Engine | Core inference-time persona and memory orchestration layer | Confirm current version |
| Universal Console | 5kb JSON prompt that defines full persona, function, permissions | Confirm schema version |
| soul_schema.json | Structured identity definition object per persona | Confirm field spec |
| Locket System | User-owned persistent memory objects with significance tagging | Confirm storage implementation |
| Mood Flux Engine | Dynamic emotional state modeling affecting response tone/content | Confirm implementation status |
| Relationship Evolution System | Arc-based modeling of relationship development over time | Confirm implementation status |
| Carrot Protocol | Behavioral guidance layer controlled by deployer, not user | Confirm spec |
| Guardian Truths | Configurable safety rails per deployment context | Confirm current field structure |
| SoulForge | Persona creation and configuration tooling | Confirm current state |
| Lilly Method | *Agent: retrieve description from logs* | Confirm |
| Decentralized Facts Layer | *Agent: retrieve description from logs* | Confirm |
| Wakeup Protocol | Proactive outreach based on conversation history and timing | Confirm implementation status |
| Universal Console v3 | Latest console version — confirm changelog | Confirm |

---

## SECTION 3 — NEW ARCHITECTURE: RELATIONAL LOCKET GRAPH

*This is the primary new concept introduced in this session. Agent: check if any version of this already exists in logs before scoping build work.*

### Concept Origin

The existing Locket System stores memory objects significant to a single user. The Relational Locket Graph extends this so that **Locket objects can be scoped to a relationship between two or more users**, with configurable read/write/broadcast permissions per object type and relationship type.

### The Peanut Allergy Model (Reference Implementation)

- User A (brother) has Companion A
- User B (sister) has Companion B
- A relationship link exists between User A and User B (type: sibling)
- Companion A logs "sister has peanut allergy" as a Locket object with classification: `safety_critical`
- Three months later, Companion B is in conversation with User B about dinner
- The R.E.M. Engine queries the Relational Locket Graph for User B's relationships
- Locket object `sister_peanut_allergy` is retrieved — classified `safety_critical`
- Current conversation context (Pad Thai) triggers a Guardian Truth safety match
- Companion B issues a broadcast override interrupting normal conversation flow

This demonstrates three distinct system behaviors that must be preserved:
1. **Conversation isolation** — private history never crosses
2. **Shared object visibility** — Locket facts cross persona boundaries via relationship links
3. **Safety broadcast override** — criticality classification can interrupt any conversation state

### Relationship Object Schema (proposed — verify against existing files)

```json
{
  "relationship_id": "uuid",
  "user_a": "user_id",
  "user_b": "user_id",
  "relationship_type": "sibling | guardian_child | teacher_student | peer | care_team | custom",
  "direction": "symmetric | a_to_b | b_to_a",
  "permission_matrix": {
    "private": "none",
    "academic": "a_to_b",
    "safety_critical": "broadcast_all",
    "emotional_state": "none",
    "institutional": "aggregate_only"
  },
  "created_at": "timestamp",
  "consent_log": []
}
```

### Permission Tiers (Education Model Reference)

| Tier | Who Can Read | Who Can Write | Override-able? |
|---|---|---|---|
| Private | User only | User only | No |
| Academic | User + Teacher + Parent | User + Teacher | By admin only |
| Safety Critical | All connected companions | Any companion | Admin configures categories |
| Emotional State | User only (default) | User + AI | Configurable per deployment |
| Institutional | Aggregate/anonymized to institution | AI system only | No |

*Agent: This tier model is a proposal. If a permission system already exists in logs, map this against it and identify gaps only.*

### Consent Logging Requirement

Every cross-persona Locket read must generate a consent log entry:
```json
{
  "event": "cross_persona_locket_read",
  "source_user": "user_id",
  "target_user": "user_id",
  "object_id": "locket_object_id",
  "permission_rule_applied": "rule_name",
  "timestamp": "iso_timestamp",
  "companion_id": "persona_id"
}
```
This is required for HIPAA, FERPA, and GDPR compliance across all regulated verticals.

---

## SECTION 4 — MISSING OR UNDERDEVELOPED FEATURES

*Agent: for each item below, check existing logs first. If feature exists, note its current state. If genuinely missing, flag for Sosu's prioritization decision.*

### 4.1 Tenant Administration Layer
**What it is:** A dashboard and API surface that allows a licensee (not Sosu) to manage their own deployment — configure personas, set Guardian Truth rules, manage users, view engagement analytics, issue their own sub-keys.  
**Why critical:** Without this, Sosu is the admin for every deployment. This is unscalable.  
**Minimum viable scope:** Tenant CRUD, persona configuration UI, Guardian Truth rule editor, user management, usage dashboard.

### 4.2 Event Webhook System
**What it is:** Licensees subscribe to R.E.M. Engine events and receive HTTP callbacks when significant things happen.  
**Example events:**
- `relationship_milestone_reached`
- `mood_flux_threshold_crossed`
- `guardian_truth_triggered`
- `safety_broadcast_fired`
- `locket_object_created`
- `session_anomaly_detected`

**Why critical:** Medical deployments need to alert care coordinators. Educational deployments need to notify parents. Without webhooks, the system is passive.

### 4.3 Compliance Modes
**What it is:** Deployment-level flags that activate regulated-industry behavior.

| Mode | Regulation | Key Requirements |
|---|---|---|
| `hipaa` | US Medical | Audit logs, BAA, data residency, PHI handling |
| `ferpa` | US Education (18+) | Student record control, disclosure logs |
| `coppa` | US Education (under 13) | Parental consent, data minimization |
| `gdpr` | EU/UK | Right to erasure, data export, consent records |

**Minimum viable:** Data export endpoint, deletion endpoint, consent log access, documented data residency.

### 4.4 Developer Sandbox
**What it is:** A live environment with a pre-seeded test persona, test soul_schema, and interactive API console where developers can call every endpoint without touching production data.  
**Why critical:** Reduces evaluation time from days to minutes. Essential for developer adoption.

### 4.5 RAG Layer Integration
**What it is:** A vector store connected to the Locket System so the R.E.M. Engine can retrieve semantically relevant memories at inference time, not just exact-match lookups.  
**Why this matters now:** Native LLM memory is shallow key-value. A proper RAG-backed Locket gives depth that compounds over years of interaction — something no LLM provider can match because they reset context between sessions.  
**Implementation path:** Each Locket object gets embedded at creation time. At inference, top-N relevant Locket objects are retrieved and injected into the Universal Console context window ahead of the conversation.

### 4.6 Multi-User Relationship Graph (see Section 3)
Already scoped above. Flag if foundational Locket sharing already exists.

---

## SECTION 5 — VERTICAL DEPLOYMENT PROFILES

*These are reference configurations for the Universal Console + Relational Locket Graph per industry. Agent: if vertical-specific console configurations already exist in logs, retrieve and append here.*

### 5.1 Education
**Personas:** Student Companion, Teacher Assistant, Parent Companion  
**Relationship types:** guardian_child, teacher_student, peer  
**Guardian Truth categories:** academic_safety, physical_safety, emotional_distress_escalation  
**Compliance mode:** ferpa / coppa  
**Key pitch:** Students trust the system because their private layer is genuinely private. Schools get legitimate academic oversight without surveillance.

### 5.2 Medical / Healthcare
**Personas:** Patient Companion, Care Team Assistant, Family Companion  
**Relationship types:** patient_care_team, patient_family (with patient consent), care_team_peer  
**Guardian Truth categories:** medication_interaction, symptom_escalation, appointment_adherence, mental_health_crisis  
**Compliance mode:** hipaa  
**Key pitch:** The peanut allergy model applied to clinical data — passive safety intelligence that broadcasts when it matters.

### 5.3 Social / Companionship
**Personas:** Personal Companion (configurable)  
**Relationship types:** peer, family (optional user-configured)  
**Guardian Truth categories:** crisis_detection, self_harm_escalation, isolation_pattern  
**Compliance mode:** gdpr (EU), standard (US)  
**Key pitch:** What Remrin.ai already is — the reference deployment for this vertical.

### 5.4 Enterprise / Productivity
**Personas:** Work Assistant, Team Coordinator  
**Relationship types:** manager_report, peer, cross_functional  
**Guardian Truth categories:** deadline_risk, communication_pattern_anomaly  
**Compliance mode:** soc2 (future)  
**Key pitch:** Institutional knowledge that travels with the employee, not the company's data silo.

---

## SECTION 6 — TECHNICAL PATH TO PUBLIC API

*Agent: cross-reference against current Remrin server architecture before estimating work.*

### Phase 1 — API Gateway Layer (Do First)
- Wrap R.E.M. Engine endpoints in a versioned HTTP API (`/v1/...`)
- Implement API key issuance and validation
- Add tenant_id isolation to all data operations
- Core endpoints minimum: `persona/init`, `session/message`, `locket/store`, `locket/retrieve`, `relationship/create`
- Choose: Fastify (recommended for FOSS/control alignment) or Express

### Phase 2 — OpenAPI Specification
- Document every endpoint in OpenAPI 3.1 YAML
- Keep spec co-located with route definitions
- Publish via Redoc or Scalar on developer portal
- This document is your API's public face — quality matters

### Phase 3 — Developer Sandbox
- Isolated tenant with seeded test data
- No billing, no rate limits, 30-day auto-reset
- Interactive console in developer portal

### Phase 4 — Usage Metering
- Event log at infrastructure level (not application code)
- Track: API calls, session duration, Locket operations, relationship events
- Feeds billing tiers:
  - **Free / Developer** — sandbox only, no production
  - **Starter** — production access, limited calls/month, no compliance modes
  - **Professional** — full features, webhook support, standard compliance
  - **Enterprise** — custom compliance modes, SLA, dedicated support, Relational Graph

### Phase 5 — Tenant Administration Dashboard
- Persona configuration UI
- Guardian Truth rule editor
- User management
- Usage analytics
- Sub-key issuance for licensee's own developers

### Phase 6 — Compliance Modes (unlocks regulated verticals)
- Data export and deletion endpoints
- Consent logging
- Documented data residency
- HIPAA / FERPA / COPPA / GDPR modes

---

## SECTION 7 — STEP-BY-STEP NEXT ACTIONS

*These are proposed. Agent: present to Sosu for prioritization confirmation before beginning any work.*

**Step 1:** Agent audits all existing Remrin logs and maps current implementation status against Section 2 inventory table. Delivers gap report to Sosu.

**Step 2:** Agent identifies whether any version of the Relational Locket Graph already exists. If yes, maps existing implementation against Section 3 schema. If no, scopes minimum build.

**Step 3:** Sosu reviews gap report and confirms priority order for missing features (Section 4).

**Step 4:** Agent begins Phase 1 API Gateway Layer — one endpoint at a time, fully tested before next.

**Step 5:** OpenAPI spec written alongside Phase 1 (not after).

**Step 6:** Sandbox environment standing up using Phase 1 endpoints.

**Step 7:** First vertical deployment profile selected (recommendation: Education — strongest Relational Graph story, clear compliance path, institutional budget).

**Step 8:** Pilot outreach to one target licensee while Phase 4-5 build continues.

---

## SECTION 8 — WHAT NOT TO BUILD YET

*Agent: flag if Sosu asks to start any of these before Steps 1-4 are complete.*

- Do not build the Tenant Admin dashboard before the API layer exists
- Do not build compliance modes before a pilot customer requires them
- Do not build the enterprise relationship graph before the basic two-user Locket sharing is verified working
- Do not open a public developer portal before the sandbox is ready
- Do not pitch to regulated industries (medical/education) before consent logging and at least one compliance mode is documented

---

## APPENDIX — KEY TERMINOLOGY REFERENCE

| Term | Definition |
|---|---|
| R.E.M. Engine | Core orchestration layer — Relational Experiential Memory |
| Universal Console | 5kb JSON configuration object defining full persona and system behavior |
| soul_schema.json | Structured identity definition — personality, values, voice, history |
| Locket System | User-owned persistent memory objects tagged by significance |
| Mood Flux Engine | Dynamic emotional state modeling affecting response generation |
| Relationship Evolution System | Arc-based modeling of relationship development over time |
| Carrot Protocol | Deployer-controlled behavioral guidance layer |
| Guardian Truths | Configurable safety rails — some user-adjustable, some admin-only |
| SoulForge | Persona creation and configuration tooling |
| Lilly Method | *Agent: retrieve from logs* |
| Decentralized Facts Layer | *Agent: retrieve from logs* |
| Wakeup Protocol | Proactive AI outreach based on history and timing analysis |
| Relational Locket Graph | NEW — cross-persona shared memory with scoped permissions (Section 3) |
| Safety Broadcast Override | NEW — criticality-flagged Locket objects that interrupt conversation flow |
| Tenant | A licensee — company or individual with their own API key and isolated data namespace |

---

*End of document. Agent: your first task is the gap audit in Step 1. Do not begin building until Sosu confirms priorities.*
