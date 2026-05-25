# Reusable Patterns

This directory stores proven implementation patterns extracted from successful intent executions. Agents reference these patterns to maintain consistency and avoid re-solving known problems.

## Format

Each pattern is a YAML file named `pattern-{NNN}.yaml`:

```yaml
pattern:
  id: "pattern-001"
  name: "REST CRUD Endpoints"
  discovered_in_intent: "intent-003"
  category: "api"
  description: "Standard pattern for CRUD operations on a resource"
  
  template:
    endpoints:
      - method: "GET"
        path: "/api/{domain}/{resource}"
        description: "List all with pagination"
        query_params: ["offset", "limit"]
      - method: "POST"
        path: "/api/{domain}/{resource}"
        description: "Create new"
      - method: "GET"
        path: "/api/{domain}/{resource}/{id}"
        description: "Get by ID"
      - method: "PUT"
        path: "/api/{domain}/{resource}/{id}"
        description: "Full update by ID"
      - method: "DELETE"
        path: "/api/{domain}/{resource}/{id}"
        description: "Delete by ID"
  
  when_to_use: "Any intent that involves managing a collection of resources"
  status: "active"
```

## Rules

- Patterns are extracted after an intent is successfully validated
- Architecture layer checks this directory before generating new contracts
- Patterns can be marked `deprecated` if a better pattern emerges
