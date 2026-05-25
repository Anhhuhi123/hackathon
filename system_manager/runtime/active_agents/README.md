# Active Agents

This directory tracks currently running agent instances.

## Format

Each active agent has a YAML file named `{agent-type}-{instance-id}.yaml`:

```yaml
agent:
  instance_id: "fe-agent-01"
  type: "frontend_agent"
  status: "active"
  started_at: "2026-05-25T10:30:00Z"
  current_intent: "intent-001"
  current_task: "task-fe-001"
  tasks_completed: 0
  tasks_failed: 0
```

## Lifecycle

- File created when agent starts a task
- Updated on task completion/failure
- Removed when agent has no active tasks
