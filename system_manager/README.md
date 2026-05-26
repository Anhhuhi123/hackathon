# System Manager — AI Organizational Engineering

## Triết lý: AI Organizational Engineering (AOE)

> *Phần mềm không được viết bởi con người. Phần mềm được sản xuất bởi một tổ chức AI có kỷ luật, có governance, và có hệ thống kiểm soát chất lượng rõ ràng.*

---

## 1. Tổng quan

`system_manager/` là trung tâm điều phối của toàn bộ hệ thống AI-native engineering. Đây không phải là một bộ tài liệu — đây là **organizational operating system** điều hành quá trình sản xuất phần mềm theo từng intent.

Hệ thống được xây dựng trên 4 nguyên tắc cốt lõi:

| Nguyên tắc | Mô tả |
|---|---|
| **Intent-driven** | Mọi công việc đều bắt đầu từ một intent rõ ràng, có ID, có lifecycle |
| **Contract-first** | FE và BE không giao tiếp trực tiếp — họ chỉ tuân theo architecture contract |
| **Layer isolation** | Mỗi layer chỉ được phép đọc/ghi file thuộc ownership của mình |
| **Deterministic flow** | Mỗi intent đi theo đúng một pipeline: Requirement → Architecture → Execution → Validation |

---

## 2. Workflow Execution

```
User Intent
    │
    ▼
[Requirement Layer]
    │  Clarify, infer, document intent
    │  Output: intent.md
    ▼
[Architecture Layer]
    │  Design APIs, contracts, schemas
    │  Output: architecture.md, frontend_task.md, backend_task.md, validation_task.md
    ▼
[FE Agent] ──────── [BE Agent]
    │  Parallel execution        │
    │  Bound to frontend_task    │  Bound to backend_task
    │  Source: FE codebase       │  Source: BE codebase
    ▼                            ▼
[Validation Layer]
    │  Test integration, contracts, UX flows
    │  Output: validation_report.md
    ▼
[Completed Intent]
    │  Status updated in intents.yaml → COMPLETED
```

---

## 3. Supervision Model

Con người trong hệ thống này đóng vai trò **Organizational Governor** — không viết code, không quyết định implementation, nhưng:

- Phê duyệt intent trước khi vào Requirement Layer
- Giám sát kiến trúc trước khi FE/BE bắt đầu thực thi
- Review validation_report.md và quyết định COMPLETED hoặc retry

AI agents đóng vai trò **Execution Workers** — có nhiệm vụ rõ ràng, có boundary rõ ràng, không được phép vượt qua ranh giới layer.

---

## 4. Intent Lifecycle

Mỗi intent trải qua các trạng thái sau:

```
PENDING → PROCESSING → COMPLETED
              │
              └──► (FAILED → retry → PROCESSING)
```

| Status | Ý nghĩa |
|---|---|
| `PENDING` | Intent đã được đăng ký, chờ xử lý |
| `PROCESSING` | Đang trong pipeline (bất kỳ layer nào) |
| `COMPLETED` | Validation passed, intent đã được deliver |
| `FAILED` | Validation failed, cần retry hoặc re-architect |

---

## 5. Cấu trúc thư mục

```
system_manager/
├── README.md                          ← File này
├── organizational_architecture.md     ← Full system flow diagram
├── intent_registry/
│   ├── intents.yaml                   ← Organizational queue
│   ├── dependency_graph.yaml          ← Inter-intent dependencies
│   └── intents/
│       └── {INTENT_ID}/              ← Isolated workspace per intent
│           ├── intent.md
│           ├── architecture.md
│           ├── frontend_task.md
│           ├── backend_task.md
│           ├── validation_task.md
│           └── validation_report.md
└── layers/
    ├── requirement_layer/
    ├── architecture_layer/
    ├── frontend_agent/
    ├── backend_agent/
    └── validation_layer/
```

---

## 6. Golden Rules

1. **Không có agent nào được phép ghi vào file của layer khác**
2. **Architecture contract là nguồn sự thật duy nhất giữa FE và BE**
3. **Không có implementation nào được bắt đầu khi chưa có architecture.md**
4. **Validation layer là cổng cuối cùng — không có exception**
5. **Mọi thay đổi đều phải trace về một intent_id cụ thể**
