# Organizational Architecture — Full System Flow

## Tổng quan kiến trúc

Tài liệu này mô tả toàn bộ luồng xử lý từ khi một **User Intent** được tạo ra cho đến khi nó trở thành một **Completed Intent** — phần mềm đã được deploy và validated.

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTENT INPUT                           │
│  "Tôi muốn người dùng có thể đăng nhập bằng email và Google OAuth" │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      REQUIREMENT LAYER                              │
│                                                                     │
│  Input:  Raw user intent (natural language)                        │
│  Process:                                                           │
│    1. Clarify ambiguity                                             │
│    2. Infer implicit requirements                                   │
│    3. Define UX expectations                                        │
│    4. Identify edge cases                                           │
│    5. Document security expectations                                │
│                                                                     │
│  Output: intent.md (fully clarified business requirement)          │
│  Updates: intents.yaml (status: PENDING → PROCESSING)              │
│                                                                     │
│  Ownership: intent.md ONLY                                         │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ARCHITECTURE LAYER                             │
│                                                                     │
│  Input:  intent.md                                                 │
│  Process:                                                           │
│    1. Design API contracts                                          │
│    2. Define request/response schemas                               │
│    3. Determine auth strategy                                       │
│    4. Make DB decisions                                             │
│    5. Identify technical constraints                                │
│    6. Map dependencies to dependency_graph.yaml                     │
│                                                                     │
│  Output:                                                            │
│    - architecture.md       (central communication contract)        │
│    - frontend_task.md      (FE execution contract)                 │
│    - backend_task.md       (BE execution contract)                 │
│    - validation_task.md    (validation scenarios)                  │
│                                                                     │
│  Ownership: architecture.md, *_task.md, dependency_graph.yaml     │
└──────────────┬──────────────────────────────┬───────────────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────┐    ┌─────────────────────────────────────┐
│     FRONTEND AGENT       │    │           BACKEND AGENT             │
│                          │    │                                     │
│  Input:                  │    │  Input:                             │
│    - architecture.md     │    │    - architecture.md                │
│    - frontend_task.md    │    │    - backend_task.md                │
│                          │    │                                     │
│  Process:                │    │  Process:                           │
│    1. Implement UI       │    │    1. Implement API endpoints       │
│    2. Integrate APIs     │    │    2. Implement business logic      │
│    3. Handle states      │    │    3. Apply security rules          │
│    4. Validate inputs    │    │    4. Write response contracts      │
│                          │    │                                     │
│  Output:                 │    │  Output:                            │
│    FE source code        │    │    BE source code                   │
│                          │    │                                     │
│  Boundary:               │    │  Boundary:                          │
│    FE codebase ONLY      │    │    BE codebase ONLY                 │
└──────────────┬───────────┘    └──────────────┬──────────────────────┘
               │                               │
               └───────────────┬───────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      VALIDATION LAYER                               │
│                                                                     │
│  Input:                                                             │
│    - frontend_task.md  (expected FE behaviors)                     │
│    - backend_task.md   (expected BE behaviors)                     │
│    - validation_task.md (test scenarios)                           │
│                                                                     │
│  Process:                                                           │
│    1. Test API contracts (does BE match schema?)                   │
│    2. Validate FE/BE integration (do they work together?)          │
│    3. Validate response schemas (correct types/fields?)            │
│    4. Validate UX flows (loading, error, success states)           │
│    5. Validate edge cases                                           │
│                                                                     │
│  Output:                                                            │
│    - validation_report.md                                          │
│      - passed tests                                                │
│      - failed tests                                                │
│      - integration issues                                           │
│      - bug summaries                                               │
│      - retry requirements                                           │
│                                                                     │
│  Decision:                                                          │
│    PASS → intent COMPLETED                                         │
│    FAIL → retry specific layer (FE, BE, or Architecture)           │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
           ┌──────────────┴──────────────┐
           │                             │
           ▼                             ▼
┌──────────────────┐         ┌──────────────────────────┐
│  COMPLETED       │         │  FAILED → RETRY          │
│                  │         │                          │
│  intents.yaml:   │         │  Route back to:          │
│  status →        │         │  - Architecture Layer    │
│  COMPLETED       │         │  - FE Agent              │
│                  │         │  - BE Agent              │
└──────────────────┘         └──────────────────────────┘
```

---

## Layer Ownership Matrix

| Layer | Can Read | Can Write | Cannot Touch |
|---|---|---|---|
| Requirement Layer | User intent | `intent.md`, `intents.yaml` | architecture.md, *_task.md, source code |
| Architecture Layer | `intent.md` | `architecture.md`, `*_task.md`, `dependency_graph.yaml` | source code, `intent.md` |
| Frontend Agent | `architecture.md`, `frontend_task.md` | FE source code | BE source code, `*.md` contracts |
| Backend Agent | `architecture.md`, `backend_task.md` | BE source code | FE source code, `*.md` contracts |
| Validation Layer | `*_task.md`, source code | `validation_report.md` | contracts, source code |

---

## Parallel Execution Protocol

FE Agent và BE Agent chạy **song song** sau khi Architecture Layer hoàn thành. Điều kiện:

- Cả hai phải đọc cùng một `architecture.md` (version-locked)
- Không được phép giao tiếp trực tiếp với nhau
- Mọi điều chỉnh contract phải đi qua Architecture Layer
- Validation chỉ bắt đầu khi cả FE và BE đều signal `READY`

---

## Retry Protocol

Khi Validation Layer phát hiện lỗi:

```
validation_report.md
    │
    ├── [BUG: FE] → Retry FE Agent với bug context
    ├── [BUG: BE] → Retry BE Agent với bug context  
    └── [CONTRACT MISMATCH] → Retry Architecture Layer → regenerate *_task.md → retry FE + BE
```

Số lần retry tối đa: **3 lần** trước khi escalate lên human governor.
