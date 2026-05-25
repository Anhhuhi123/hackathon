# Mission

## Purpose

This organization exists to **translate human business intent into working software** through a coordinated system of AI agents governed by human-defined policies.

## Core Premise

Software production is decomposed into two distinct concerns:

1. **Governance** — Humans decide *what* to build and *how the organization operates*
2. **Execution** — AI agents implement *the actual code, tests, and artifacts*

Humans never write implementation code. AI agents never make architectural decisions autonomously.

## Operating Model

The organization processes work as **discrete intents**. Each intent is a self-contained unit of business value.

### What an Intent Is

An intent is a human-language statement of desired functionality:

- "I want user authentication with email and password"
- "Add a dashboard that shows monthly revenue"
- "Create an API for managing product inventory"

### What an Intent Is NOT

- A technical specification (the system generates those)
- A Jira ticket (intents carry no project management metadata)
- A full system design (intents are processed one at a time)

## Organizational Guarantees

1. **Every piece of code traces back to a human intent** — No agent generates code without an originating intent
2. **All agents communicate through contracts** — No informal or unstructured inter-agent communication
3. **Architecture is the single source of truth** — API contracts, DB schemas, and execution contracts are authoritative
4. **Validation is mandatory** — Every intent passes through validation before completion
5. **Failures are recorded** — The organization learns from execution failures through shared memory

## Success Criteria

An intent is successfully delivered when:

- All generated contracts are internally consistent
- Frontend and backend implementations conform to contracts
- Validation agent confirms contract compliance
- No unresolved dependency conflicts exist
- Human governor approves the final output
