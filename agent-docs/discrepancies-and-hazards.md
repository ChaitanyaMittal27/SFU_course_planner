# Documentation discrepancies and implementation hazards

This is a targeted list of durable, change-relevant discrepancies. It is not a general defect tracker.

| Subject | Verified state | Why it matters |
| --- | --- | --- |
| `init_db/legacy/scripts_README.md` | Describes `populate_courses_deep_first.py`; the repository instead contains `populate_courses_deep_latest_semester.py`. Some stated pass/year names also differ from script constants. | Inspect scripts themselves before data maintenance. |
| Email outcome | The mail helper logs and swallows exceptions; callers update response/state afterward. | “Sent” UI/state means attempted, not delivery-confirmed. |
| Local Dashboard verification | With the local Supabase/Compose stack, local sign-in and the preference-creation trigger succeeded, but Dashboard rendered blank. Production behavior is known to work; root cause remains unverified. | Do not treat local Dashboard as a completed integration test; include it in the logic-flow audit and add a regression test once understood. |

`README.md` and `agent-docs/AGENTS.md` substantially match the active high-level architecture and intended frontend conventions, but source remains the authority for exact runtime behavior.
