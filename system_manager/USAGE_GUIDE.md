# Hướng Dẫn Sử Dụng — System Manager

## Tổng Quan Hệ Thống

Hệ thống có **2 nhóm vai trò chính**:

| Nhóm | Vai trò | Người thực hiện |
|------|---------|----------------|
| **Governance (Quản trị)** | Human Governor, Architecture Supervisor | Con người |
| **Execution (Thực thi)** | Intent Agent, Architecture Agent, Execution Planner, FE Agent, BE Agent, Validation Agent | AI |

### Luồng xử lý tổng thể

```
Con người gửi Intent → AI phân tích → AI tạo contracts → AI chia task → AI code FE/BE song song → AI kiểm tra → Hoàn thành
```

---

# PHẦN 1: VAI TRÒ CON NGƯỜI

---

## Vai Trò 1: Human Governor (Người Quản Trị Tổ Chức)

### Bạn là ai?

Bạn là người đưa ra ý tưởng kinh doanh và phê duyệt kết quả. Bạn **KHÔNG** cần viết code.

### Bạn làm gì?

#### Bước 1: Gửi Intent (Ý định kinh doanh)

Mở file `intent_registry/active_intents.yaml` và thêm intent mới:

```yaml
# Thêm vào cuối danh sách intents:
- intent_id: "intent-003"
  submitted_by: "human_governor"
  submitted_at: "2026-05-25T15:00:00Z"
  raw_intent: "Tôi muốn trang đăng nhập bằng email và mật khẩu"
  status: "submitted"
  current_layer: "intent_layer"
  priority: "high"
  features: []
  contracts_generated: false
  contracts_approved: false
  assigned_agents: {}
  created_at: "2026-05-25T15:00:00Z"
  updated_at: "2026-05-25T15:00:00Z"
```

**Quy tắc viết intent:**
- Viết bằng ngôn ngữ tự nhiên, mô tả **điều bạn muốn**, không mô tả kỹ thuật
- ✅ Tốt: "Tôi muốn trang đăng nhập bằng email và mật khẩu"
- ✅ Tốt: "Thêm dashboard hiển thị doanh thu theo tháng"
- ❌ Sai: "Tạo POST /api/auth/login với JWT RS256"
- ❌ Sai: "Dùng React Hook Form với Zod validation"

#### Bước 2: Chờ AI phân tích và tạo contracts

Sau khi gửi intent, hệ thống AI tự động:
1. **Intent Layer** phân tích → tạo danh sách features
2. **Architecture Layer** tạo contracts (API, Database, Execution)

Bạn theo dõi tiến trình tại: `intent_registry/execution_state.yaml`

```yaml
# Khi status chuyển sang "awaiting_review" → đến lượt bạn phê duyệt
overall_status: "awaiting_review"
```

#### Bước 3: Phê duyệt hoặc yêu cầu thay đổi

Khi nhận được contracts, bạn đọc file `runtime/execution_logs/{intent-id}.log.yaml` để xem AI đề xuất gì.

**Nếu đồng ý:** Cập nhật `active_intents.yaml`:
```yaml
contracts_approved: true
status: "executing"
```

**Nếu không đồng ý:** Gửi escalation response:
```yaml
# Thêm vào execution_state.yaml phần escalations:
escalations:
  - response_to: "msg-escalation-001"
    decision: "opt-1"
    comment: "Chỉ cần đăng nhập email/password, không cần OAuth"
```

#### Bước 4: Xem kết quả cuối cùng

Khi `status: "completed"`:
- Xem code FE tại artifacts của frontend_agent
- Xem code BE tại artifacts của backend_agent
- Xem kết quả kiểm tra tại `runtime/validation_reports/`

#### Bước 5: Xử lý escalation (khi AI không chắc chắn)

AI sẽ hỏi bạn khi gặp tình huống mơ hồ. Bạn kiểm tra `execution_state.yaml`:

```yaml
escalations:
  - source: "architecture_layer"
    reason: "ambiguous_requirement"
    description: "Intent nói 'login' nhưng không rõ OAuth hay email/password"
    options:
      - option_id: "opt-1"
        description: "Chỉ email/password"
      - option_id: "opt-2"
        description: "Email/password + Google OAuth"
```

Bạn chọn option và cập nhật:
```yaml
escalation_response:
  selected_option: "opt-1"
  comment: "MVP chỉ cần email/password"
```

### Tóm tắt workflow của Human Governor

```
1. Viết intent → active_intents.yaml
2. Chờ AI phân tích (theo dõi execution_state.yaml)
3. Phê duyệt contracts (hoặc yêu cầu thay đổi)
4. Trả lời escalations (nếu có)
5. Xem kết quả cuối cùng
```

---

## Vai Trò 2: Architecture Supervisor (Giám Sát Kiến Trúc)

### Bạn là ai?

Bạn là người kiểm tra chất lượng kiến trúc của hệ thống. Bạn đảm bảo contracts hợp lý và nhất quán.

### Bạn làm gì?

#### Bước 1: Review API Contracts

Khi Architecture Layer tạo xong contracts, bạn kiểm tra theo checklist trong `layers/architecture_layer/api_contract_rules.md`:

```
□ Path đúng convention: /api/{domain}/{resource}
□ Method phù hợp (GET đọc, POST tạo, PUT sửa, DELETE xóa)
□ Tất cả request fields có type và constraints
□ Có ít nhất 1 success response và 1 error response
□ Error codes dùng chuẩn (VALIDATION_ERROR, NOT_FOUND, etc.)
□ Auth requirement được set rõ ràng
```

#### Bước 2: Review Database Contracts

Kiểm tra DB contracts:

```
□ Table name dùng plural snake_case (users, products)
□ Primary key là UUID
□ Có created_at và updated_at
□ Foreign keys có cascade rules
□ Index cho các columns dùng trong WHERE
```

#### Bước 3: Review Execution Contracts

Kiểm tra mỗi execution contract có:

```
□ Ít nhất 2 acceptance criteria
□ Các criteria có thể test được (không mơ hồ)
□ Edge cases được liệt kê
□ Security constraints phù hợp
```

#### Bước 4: Phê duyệt hoặc yêu cầu sửa

**Nếu OK:** Cập nhật contract status:
```yaml
status: "active"  # Từ "draft" hoặc "review" → "active"
```

**Nếu cần sửa:** Tạo amendment request:
```yaml
amendment_request:
  contract_id: "api-001"
  requested_by: "architecture_supervisor"
  changes:
    - field: "response.200.schema"
      current: "chỉ có access_token"
      requested: "thêm user_id vào response"
      reason: "FE cần user_id để redirect đến profile"
```

#### Bước 5: Ghi nhận Architecture Decision

Khi có quyết định kiến trúc quan trọng, tạo ADR trong `shared_memory/architecture_decisions/`:

```yaml
# File: adr-001.yaml
adr:
  id: "adr-001"
  date: "2026-05-25"
  intent_id: "intent-001"
  title: "Dùng JWT HS256 cho authentication"
  context: "Cần stateless auth cho API"
  decision: "JWT HS256, access token 1 giờ, refresh token 7 ngày"
  alternatives_considered:
    - "Session cookies — loại vì cần stateful server"
  consequences:
    - "Cần quản lý JWT secret qua env variable"
  status: "accepted"
```

### Tóm tắt workflow của Architecture Supervisor

```
1. Nhận thông báo contracts đã tạo xong
2. Review API contracts (theo checklist)
3. Review DB contracts (theo checklist)
4. Review Execution contracts (theo checklist)
5. Phê duyệt hoặc yêu cầu sửa
6. Ghi nhận ADR cho quyết định quan trọng
```

---

# PHẦN 2: VAI TRÒ AI AGENTS

> **Lưu ý cho con người:** Phần này mô tả cách AI agents hoạt động. Bạn không cần thực hiện các bước này — AI tự làm. Phần này giúp bạn hiểu AI đang làm gì để giám sát tốt hơn.

---

## Agent 1: Intent Layer (AI Phân Tích Ý Định)

### Agent này làm gì?

Nhận raw intent từ con người → phân tích → tạo danh sách features có cấu trúc.

### Quy trình thực hiện

**Input nhận được:**
```yaml
intent_id: "intent-001"
raw_intent: "Tôi muốn trang đăng nhập bằng email và mật khẩu"
```

**Bước 1:** Đọc inference rules tại `layers/intent_layer/inference_rules.md`

**Bước 2:** Áp dụng rules để suy luận:
- "đăng nhập" → trigger Rule 1 (Authentication Inference)
- Suy ra: user_login, user_registration, forgot_password, input_validation
- Áp dụng Rule 6: thêm flag auth_required cho mỗi feature

**Bước 3:** Tạo output theo schema tại `layers/intent_layer/output_schema.md`

**Bước 4:** Gửi message `intent_decomposition` đến Architecture Layer

**Output tạo ra:**
```yaml
type: intent_decomposition
payload:
  intent_id: "intent-001"
  confidence: 0.92
  decomposed_features:
    - feature_id: "feat-001"
      name: "user_login"
      description: "Xác thực người dùng bằng email và mật khẩu"
      category: "authentication"
      requires_api: true
      requires_ui: true
      requires_db: true
      auth_required: false
    - feature_id: "feat-002"
      name: "forgot_password"
      description: "Cho phép đặt lại mật khẩu qua email"
      category: "authentication"
      requires_api: true
      requires_ui: true
      requires_db: false
      auth_required: false
    # ... thêm features
```

**Khi nào escalate (hỏi con người):**
- Confidence < 0.7
- Intent có nhiều cách hiểu khác nhau
- Intent quá mơ hồ để phân tích

### Files agent này đọc:
- `layers/intent_layer/inference_rules.md` — Quy tắc suy luận
- `layers/intent_layer/prompt.md` — System prompt
- `layers/intent_layer/output_schema.md` — Cấu trúc output
- `intent_registry/active_intents.yaml` — Kiểm tra trùng lặp

---

## Agent 2: Architecture Layer (AI Kiến Trúc)

### Agent này làm gì?

Nhận decomposed features → tạo API contracts, DB contracts, Execution contracts.

### Quy trình thực hiện

**Input nhận được:** Message `intent_decomposition` từ Intent Layer

**Bước 1:** Đọc rules tại:
- `layers/architecture_layer/architecture_rules.md`
- `layers/architecture_layer/api_contract_rules.md`

**Bước 2:** Với mỗi feature có `requires_api: true`, tạo API contract:
```yaml
api_contract:
  contract_id: "api-001"
  endpoint:
    method: "POST"
    path: "/api/auth/login"
    auth_required: false
  request:
    body:
      email: { type: "string", required: true, constraints: { format: "email" } }
      password: { type: "string", required: true, constraints: { min_length: 8 } }
  responses:
    - status: 200
      schema:
        access_token: { type: "string" }
        refresh_token: { type: "string" }
        expires_in: { type: "integer" }
    - status: 401
      schema:
        error: { type: "string" }
        code: { type: "string" }  # "INVALID_CREDENTIALS"
```

**Bước 3:** Với mỗi feature có `requires_db: true`, tạo DB contract:
```yaml
db_contract:
  contract_id: "db-001"
  table: "users"
  columns:
    id: { type: "uuid", primary: true }
    email: { type: "varchar(255)", unique: true, not_null: true }
    password_hash: { type: "varchar(255)", not_null: true }
    created_at: { type: "timestamptz", default: "now()" }
    updated_at: { type: "timestamptz", default: "now()" }
```

**Bước 4:** Tạo execution contracts (điều kiện chấp nhận):
```yaml
execution_contract:
  contract_id: "exec-001"
  acceptance_criteria:
    - "Trả 200 với JWT khi email+password đúng"
    - "Trả 401 khi password sai"
    - "Trả 401 khi email không tồn tại"
    - "Password không bao giờ xuất hiện trong response"
```

**Bước 5:** Gửi message `architecture_contract` đến Execution Planning

### Files agent này đọc:
- `layers/architecture_layer/architecture_rules.md`
- `layers/architecture_layer/api_contract_rules.md`
- `layers/architecture_layer/output_schema.md`
- `organizational_constitution/architectural_policy.md`
- `shared_memory/reusable_patterns/` — Tái sử dụng patterns đã có

---

## Agent 3: Execution Planner (AI Lập Kế Hoạch)

### Agent này làm gì?

Nhận contracts → chia thành tasks cụ thể → phân công cho FE/BE agents.

### Quy trình thực hiện

**Input nhận được:** Message `architecture_contract` từ Architecture Layer

**Bước 1:** Đọc rules tại `layers/execution_planning/task_decomposition.md`

**Bước 2:** Tách tasks theo 4 phase:

```
Phase 1 (tuần tự): Database migrations
Phase 2 (song song): FE implementation + BE implementation
Phase 3 (tuần tự): Unit tests
Phase 4 (song song): Validation checks
```

**Bước 3:** Tạo task assignments:

```yaml
# Gửi cho Backend Agent
tasks:
  - task_id: "task-be-001"
    task_type: "db_migration"
    phase: 1
    contract_ref: "db-001"
    description: "Tạo bảng users"
    depends_on: []

  - task_id: "task-be-002"
    task_type: "api_implementation"
    phase: 2
    contract_ref: "api-001"
    description: "Implement POST /api/auth/login"
    depends_on: ["task-be-001"]

# Gửi cho Frontend Agent (SONG SONG với Backend)
  - task_id: "task-fe-001"
    task_type: "ui_implementation"
    phase: 2
    contract_ref: "feat-001"
    description: "Tạo trang login"
    depends_on: []  # Không phụ thuộc BE!
```

**Bước 4:** Gửi `task_assignment` messages đến FE/BE agents

**Bước 5:** Theo dõi tiến trình, cập nhật `execution_state.yaml`

**Xử lý lỗi:**
- Task fail → retry tối đa 2 lần
- Fail sau 2 retry → escalate đến Human Governor
- Agent bị block → kiểm tra dependency, unblock hoặc escalate

### Files agent này đọc:
- `layers/execution_planning/task_decomposition.md`
- `layers/execution_planning/orchestration_policy.md`
- `layers/execution_planning/execution_schema.md`
- `intent_registry/dependency_graph.yaml`

---

## Agent 4: Frontend Agent (AI Lập Trình FE)

### Agent này làm gì?

Nhận task assignment + API contract → tạo code UI, API client, validation.

### Quy trình thực hiện

**Input nhận được:** Message `task_assignment` từ Execution Planner

**Bước 1:** Đọc rules tại `layers/frontend_agent/coding_rules.md`

**Bước 2:** Từ API contract, tạo TypeScript types:
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}
```

**Bước 3:** Tạo API client function:
```typescript
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}
```

**Bước 4:** Tạo UI component:
```typescript
export function LoginPage() {
  // Form với email + password
  // Validation theo contract constraints
  // Error handling cho tất cả error codes trong contract
  // Loading state khi submit
}
```

**Bước 5:** Tạo client-side validation (mirror contract constraints):
```typescript
// Từ contract: email { format: "email", max_length: 255 }
// Từ contract: password { min_length: 8, max_length: 128 }
export function validateLoginForm(data: LoginRequest) { ... }
```

**Bước 6:** Gửi `implementation_artifact` đến Validation Layer

**Quan trọng:**
- FE agent làm việc với **contract**, KHÔNG chờ BE agent xong
- FE và BE chạy **song song** — cả hai đều đọc cùng 1 API contract
- FE KHÔNG được thêm API call nào không có trong contract

### Files agent này đọc:
- `layers/frontend_agent/coding_rules.md`
- `layers/frontend_agent/output_schema.md`
- API contracts từ task assignment

---

## Agent 5: Backend Agent (AI Lập Trình BE)

### Agent này làm gì?

Nhận task assignment + contracts → tạo code API, database models, services, tests.

### Quy trình thực hiện

**Input nhận được:** Message `task_assignment` từ Execution Planner

**Bước 1:** Đọc rules tại:
- `layers/backend_agent/service_rules.md`
- `layers/backend_agent/security_rules.md`

**Bước 2:** Tạo database model (từ DB contract):
```python
class User(Base):
    __tablename__ = "users"
    id = Column(UUID, primary_key=True, default=uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now())
```

**Bước 3:** Tạo code theo layering (Route → Service → Repository):
```
src/routes/auth.py      ← HTTP handling
src/services/auth.py    ← Business logic
src/repositories/user.py ← Database queries
src/schemas/auth.py     ← Request/response validation
```

**Bước 4:** Áp dụng security rules:
- Password hash bằng bcrypt
- JWT secret từ environment variable
- Input validation bằng Pydantic
- Error messages không leak thông tin nội bộ

**Bước 5:** Viết unit tests (từ execution contract):
```python
def test_login_success():
    """acceptance: Trả 200 với JWT khi email+password đúng"""
    
def test_login_wrong_password():
    """acceptance: Trả 401 khi password sai"""

def test_login_nonexistent_email():
    """acceptance: Trả 401 khi email không tồn tại"""
```

**Bước 6:** Gửi `implementation_artifact` đến Validation Layer

### Files agent này đọc:
- `layers/backend_agent/service_rules.md`
- `layers/backend_agent/security_rules.md`
- `layers/backend_agent/output_schema.md`
- Contracts từ task assignment

---

## Agent 6: Validation Layer (AI Kiểm Tra)

### Agent này làm gì?

Nhận artifacts từ FE + BE → kiểm tra tính nhất quán → báo cáo kết quả.

### Quy trình thực hiện

**Input nhận được:** `implementation_artifact` messages từ FE và BE agents

**Bước 1:** Đọc rules tại `layers/validation_layer/testing_policy.md`

**Bước 2:** Chạy 4 loại kiểm tra:

**Kiểm tra 1 — Contract Compliance:**
```
□ BE route method + path khớp API contract?
□ BE request validation khớp contract constraints?
□ BE response fields khớp contract response schema?
□ FE API client gọi đúng method + path?
□ FE dùng đúng response fields?
```

**Kiểm tra 2 — Cross-Agent Consistency:**
```
□ FE gửi đúng fields mà BE expect?
□ FE đọc đúng fields mà BE trả về?
□ FE xử lý tất cả error codes mà BE có thể trả?
□ FE validation rules khớp BE validation rules?
```

**Kiểm tra 3 — Acceptance Criteria:**
```
□ Mỗi acceptance criterion có test case tương ứng?
□ Tests cover positive + negative + edge cases?
```

**Kiểm tra 4 — Structural Integrity:**
```
□ Không có file thừa (mỗi file trace đến 1 task)
□ Imports giữa các files hợp lệ
□ Không có duplicate route definitions
```

**Bước 3:** Tạo validation report:

```yaml
validation_result:
  status: "pass"  # hoặc "fail" hoặc "partial"
  summary:
    total_checks: 8
    passed: 8
    failed: 0
```

**Nếu fail:** Tạo required_actions gửi lại cho Execution Planner:
```yaml
required_actions:
  - target: "backend_agent"
    action: "Thêm test cho trường hợp email không tồn tại"
    severity: "required"
```

**Bước 4:** Lưu report vào `runtime/validation_reports/`

### Files agent này đọc:
- `layers/validation_layer/testing_policy.md`
- `layers/validation_layer/validation_schema.md`
- Tất cả contracts của intent đang validate
- Tất cả artifacts của FE + BE agents

---

# PHẦN 3: TỔNG HỢP — VÍ DỤ END-TO-END

## Ví dụ: "Tôi muốn trang đăng nhập"

### Timeline thực hiện

```
Thời gian    Ai làm              Làm gì
─────────    ──────              ──────
T+0          Human Governor      Gửi intent: "Tôi muốn trang đăng nhập"
T+1          Intent Layer (AI)   Phân tích → 4 features (login, register, forgot_pw, validation)
T+2          Arch Layer (AI)     Tạo 3 API contracts + 1 DB contract + 3 execution contracts
T+3          Arch Supervisor     Review contracts → Approve ✅
T+4          Exec Planner (AI)   Chia 10 tasks, 4 phases
T+5          BE Agent (AI)       Phase 1: Tạo bảng users (migration)
T+6          FE Agent (AI)       Phase 2: Tạo LoginPage, ForgotPasswordPage, API client
T+6          BE Agent (AI)       Phase 2: Implement login, register, forgot-password APIs
T+7          BE Agent (AI)       Phase 3: Viết unit tests
T+8          Validation (AI)     Phase 4: Kiểm tra FE/BE consistency → Pass ✅
T+9          System              Status → "completed"
T+10         Human Governor      Xem kết quả, nhận code hoàn chỉnh
```

### Điều gì xảy ra khi có lỗi?

```
Scenario 1: AI không hiểu intent
→ Intent Layer escalate → Human Governor trả lời → AI tiếp tục

Scenario 2: FE và BE không khớp
→ Validation fail → Execution Planner tạo fix tasks → Agents sửa → Re-validate

Scenario 3: Task fail sau 2 retry
→ Escalate đến Human Governor → Người giải quyết → AI tiếp tục
```

---

# PHẦN 4: CÁC FILE QUAN TRỌNG NHẤT

| Bạn cần gì? | Đọc file nào? |
|-------------|---------------|
| Hiểu hệ thống hoạt động thế nào | `README.md` |
| Biết cách agents giao tiếp | `organizational_constitution/communication_protocol.md` |
| Biết API contracts được tạo thế nào | `layers/architecture_layer/api_contract_rules.md` |
| Biết tasks được chia thế nào | `layers/execution_planning/task_decomposition.md` |
| Xem tiến trình hiện tại | `intent_registry/execution_state.yaml` |
| Xem kết quả validation | `runtime/validation_reports/` |
| Xem lỗi đã học được | `shared_memory/learned_failures/` |

---

# PHẦN 5: CÂU HỎI THƯỜNG GẶP

**Q: Tôi (con người) có cần biết lập trình không?**
A: Không. Bạn chỉ cần viết intent bằng ngôn ngữ tự nhiên và phê duyệt kết quả.

**Q: AI có thể tự thay đổi kiến trúc không?**
A: Không. Mọi thay đổi kiến trúc phải qua Architecture Supervisor phê duyệt.

**Q: Nếu AI tạo code sai thì sao?**
A: Validation Layer sẽ phát hiện và yêu cầu sửa. Nếu sửa 3 lần vẫn fail → escalate cho con người.

**Q: FE và BE có chờ nhau không?**
A: Không. Cả hai làm việc song song dựa trên cùng 1 API contract.

**Q: Tôi có thể dừng giữa chừng không?**
A: Có. Human Governor có thể pause execution bất cứ lúc nào.

**Q: Làm sao biết intent đang ở bước nào?**
A: Xem `intent_registry/execution_state.yaml` — file này cập nhật realtime.
