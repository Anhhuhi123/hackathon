# Validation Reports

This directory stores the output of validation runs.

## Format

Each validation run produces: `{intent-id}-cycle-{N}.yaml`

Contains the full `validation_result` message as defined in `layers/validation_layer/validation_schema.md`.

## Rules

- One file per validation cycle per intent
- Maximum 3 cycles before escalation to human governor
- Reports are retained permanently for audit purposes
