# Architecture Layer — API Contract Rules

## Purpose

This file defines the detailed rules for generating API contracts. These contracts are the **binding agreement** between frontend and backend agents. Both sides implement against the contract; neither may deviate.

## API Contract Structure

Every API contract must contain all of the following sections:

```yaml
api_contract:
  contract_id: string              # Unique ID: "api-{NNN}"
  intent_id: string                # Originating intent
  feature_ref: string              # Feature this endpoint serves
  
  endpoint:
    method: enum                   # GET | POST | PUT | PATCH | DELETE
    path: string                   # Full path including /api prefix
    description: string            # What this endpoint does
    auth_required: boolean         # Whether Bearer JWT is required
  
  request:
    headers:                       # Required headers beyond standard
      - name: string
        required: boolean
        description: string
    path_params:                   # URL path parameters
      - name: string
        type: string
        description: string
    query_params:                  # Query string parameters
      - name: string
        type: string
        required: boolean
        default: any | null
        description: string
    body:                          # Request body (for POST/PUT/PATCH)
      content_type: string         # "application/json"
      schema:
        field_name:
          type: string
          required: boolean
          constraints: object      # min_length, max_length, format, enum, etc.
          description: string
  
  responses:
    - status: integer              # HTTP status code
      description: string
      schema:
        field_name:
          type: string
          nullable: boolean
          description: string
```

## Endpoint Design Rules

### Path Structure

```
/api/{domain}/{resource}
/api/{domain}/{resource}/{id}
/api/{domain}/{resource}/{id}/{sub-resource}
```

**Examples:**
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/forgot-password
GET    /api/users/me
PUT    /api/users/me
GET    /api/products
POST   /api/products
GET    /api/products/{id}
PUT    /api/products/{id}
DELETE /api/products/{id}
```

### HTTP Method Usage

| Method | Usage | Request Body | Idempotent |
|--------|-------|-------------|------------|
| GET | Read resource(s) | No | Yes |
| POST | Create resource or action | Yes | No |
| PUT | Full update of resource | Yes | Yes |
| PATCH | Partial update of resource | Yes | Yes |
| DELETE | Remove resource | No | Yes |

### Standard Response Patterns

**Successful creation (201):**
```yaml
status: 201
schema:
  id: { type: "string", description: "Created resource ID" }
  # ... all created resource fields
```

**Successful list (200):**
```yaml
status: 200
schema:
  items: { type: "array", items: "ResourceObject" }
  total: { type: "integer", description: "Total matching items" }
  offset: { type: "integer" }
  limit: { type: "integer" }
```

**Successful delete (204):**
```yaml
status: 204
schema: null  # No body
```

### Standard Error Codes

Every API must use these error codes consistently:

| HTTP Status | Error Code | When |
|------------|------------|------|
| 400 | `VALIDATION_ERROR` | Request body fails validation |
| 401 | `UNAUTHORIZED` | Missing or invalid auth token |
| 401 | `INVALID_CREDENTIALS` | Wrong email/password |
| 403 | `FORBIDDEN` | Authenticated but not authorized |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 409 | `CONFLICT` | Resource already exists (e.g., duplicate email) |
| 422 | `UNPROCESSABLE_ENTITY` | Valid JSON but semantically wrong |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

### Authentication Contract

All endpoints with `auth_required: true` must:

1. Expect `Authorization: Bearer {token}` header
2. Return 401 with `UNAUTHORIZED` if token is missing or expired
3. Return 403 with `FORBIDDEN` if token is valid but user lacks permission

The JWT token contains:
```yaml
jwt_claims:
  sub: string          # User ID (UUID)
  exp: integer         # Expiration timestamp
  iat: integer         # Issued at timestamp
```

## Full Example: Login API Contract

```yaml
api_contract:
  contract_id: "api-001"
  intent_id: "intent-001"
  feature_ref: "feat-001"
  
  endpoint:
    method: "POST"
    path: "/api/auth/login"
    description: "Authenticate user with email and password"
    auth_required: false
  
  request:
    headers: []
    path_params: []
    query_params: []
    body:
      content_type: "application/json"
      schema:
        email:
          type: "string"
          required: true
          constraints:
            format: "email"
            max_length: 255
          description: "User's email address"
        password:
          type: "string"
          required: true
          constraints:
            min_length: 8
            max_length: 128
          description: "User's password"
  
  responses:
    - status: 200
      description: "Login successful"
      schema:
        access_token:
          type: "string"
          nullable: false
          description: "JWT access token"
        refresh_token:
          type: "string"
          nullable: false
          description: "JWT refresh token"
        expires_in:
          type: "integer"
          nullable: false
          description: "Access token lifetime in seconds"
    
    - status: 401
      description: "Invalid credentials"
      schema:
        error:
          type: "string"
          nullable: false
          description: "Error message"
        code:
          type: "string"
          nullable: false
          description: "Error code: INVALID_CREDENTIALS"
    
    - status: 400
      description: "Validation error"
      schema:
        error:
          type: "string"
          nullable: false
          description: "Error message"
        code:
          type: "string"
          nullable: false
          description: "Error code: VALIDATION_ERROR"
        details:
          type: "object"
          nullable: true
          description: "Field-level validation errors"
```

## Contract Completeness Checklist

Before an API contract is sent to execution planning, verify:

- [ ] Path follows `/api/{domain}/{resource}` convention
- [ ] Method is appropriate for the operation
- [ ] All request fields have types and constraints
- [ ] All required fields are marked
- [ ] At least one success response is defined
- [ ] At least one error response is defined
- [ ] Error responses use standard error codes
- [ ] Auth requirement is explicitly set
- [ ] Description is clear and non-ambiguous
