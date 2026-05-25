# Execution Logs

This directory stores chronological logs of all messages exchanged during intent execution.

## Format

Each intent gets a log file: `{intent-id}.log.yaml`:

```yaml
log:
  intent_id: "intent-001"
  entries:
    - timestamp: "2026-05-25T10:00:00Z"
      type: "intent_submitted"
      source: "human_governor"
      summary: "Raw intent submitted: 'I want a login page'"

    - timestamp: "2026-05-25T10:10:00Z"
      type: "intent_decomposition"
      source: "intent_layer"
      target: "architecture_layer"
      summary: "Decomposed into 4 features"
      message_id: "msg-001"

    - timestamp: "2026-05-25T10:25:00Z"
      type: "architecture_contract"
      source: "architecture_layer"
      target: "execution_planning"
      summary: "Generated 3 API contracts, 1 DB contract, 3 execution contracts"
      message_id: "msg-002"
```

## Rules

- Every message exchanged is logged
- Logs are append-only
- Logs are used for debugging failed intents
- Logs are purged 30 days after intent completion
