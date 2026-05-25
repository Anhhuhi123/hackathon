# Learned Failures

This directory stores structured records of execution failures. Agents consult these records to avoid repeating known mistakes.

## Format

Each failure is a YAML file named `failure-{NNN}.yaml`:

```yaml
failure:
  id: "failure-001"
  date: "2026-05-25"
  intent_id: "intent-001"
  task_id: "task-be-002"
  agent: "backend_agent"
  
  what_happened: "Agent used bcrypt library which was not installed in the project"
  root_cause: "Agent assumed bcrypt was available without checking project dependencies"
  resolution: "Switched to passlib with bcrypt scheme, which was already a project dependency"
  
  lesson: "Always check existing project dependencies before importing new libraries"
  prevention_rule: "Agents must list all imports and verify they exist in requirements.txt before using them"
  
  status: "resolved"
```

## Rules

- Every failed task that required human intervention gets a failure record
- Every retry that succeeded gets a failure record (to document what went wrong)
- Agents check this directory before starting tasks in similar domains
- Failures older than 30 days without recurrence can be archived
