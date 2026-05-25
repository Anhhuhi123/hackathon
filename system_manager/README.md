# System Manager — AI Organizational Operating System

## What This Is

This is the governance framework for an **AI-native software production organization**. Humans describe business intent; AI agents decompose and execute. The system processes work **intent-by-intent**, not as monolithic projects.

## How It Works

```
Human Intent → Intent Layer → Architecture Layer → Execution Planning → FE/BE Agents → Validation → Done
```

### Roles

| Role | Actor | Responsibility |
|------|-------|----------------|
| Organizational Governor | Human | Define intents, approve architecture, set policies |
| Architecture Supervisor | Human | Review contracts, resolve conflicts, guide decisions |
| Intent Decomposer | AI Agent | Break raw intent into structured requirements |
| Architecture Agent | AI Agent | Generate API/DB/execution contracts |
| Execution Planner | AI Agent | Split work into parallel FE/BE tasks |
| Frontend Agent | AI Agent | Implement UI components and pages |
| Backend Agent | AI Agent | Implement APIs, services, and data layers |
| Validation Agent | AI Agent | Verify consistency, run tests, report gaps |

### Execution Flow

1. **Human** submits a business intent (e.g., "I want a login page")
2. **Intent Layer** decomposes into structured requirements (login API, JWT, forgot password, etc.)
3. **Architecture Layer** generates contracts (API schemas, DB models, execution contracts)
4. **Execution Planner** creates parallel task trees for FE and BE agents
5. **FE/BE Agents** execute tasks against contracts
6. **Validation Layer** checks contract compliance and cross-agent consistency
7. **Intent state** updates to `completed` or cycles back with feedback

## Directory Structure

```
system_manager/
├── organizational_constitution/   # Governance rules and policies
├── intent_registry/               # Active intents and their execution state
├── layers/                        # Agent layer definitions and schemas
│   ├── intent_layer/              # Intent decomposition agent
│   ├── architecture_layer/        # Contract generation agent
│   ├── execution_planning/        # Task orchestration agent
│   ├── frontend_agent/            # UI implementation agent
│   ├── backend_agent/             # API/service implementation agent
│   └── validation_layer/          # Testing and consistency agent
├── shared_memory/                 # Persistent organizational knowledge
└── runtime/                       # Live execution state
```

## Key Files

| File | Purpose |
|------|---------|
| `communication_protocol.md` | How agents exchange structured messages |
| `api_contract_rules.md` | How API contracts are defined and enforced |
| `execution_schema.md` | Schema for execution task objects |
| `task_decomposition.md` | How intents become executable tasks |
| `output_schema.md` (per layer) | What each agent produces |

## Quick Start

1. Read `organizational_constitution/mission.md` to understand the system's purpose
2. Read `communication_protocol.md` to understand inter-agent messaging
3. Submit an intent to the `intent_registry/active_intents.yaml`
4. The system processes it through the layer pipeline
5. Monitor execution in `runtime/execution_logs/`
