# Intent: EXAMPLE_001
# Title: Example Intent — Authentication System
# Status: COMPLETED
# Created: 2026-05-26T00:00:00Z

---

## Business Objective

Cho phép người dùng đăng nhập vào hệ thống bằng **email/password** hoặc **Google OAuth 2.0**. Đây là foundation cho toàn bộ user-facing features của ứng dụng.

---

## Inferred Requirements

### Functional Requirements

1. **Email/Password Authentication**
   - Người dùng có thể đăng ký tài khoản bằng email + password
   - Người dùng có thể đăng nhập bằng email + password đã đăng ký
   - Password phải được hash (không lưu plaintext)
   - Email phải unique trong hệ thống

2. **Google OAuth 2.0**
   - Người dùng có thể sign in/sign up bằng Google account
   - Hệ thống tự động tạo user profile từ Google profile nếu chưa tồn tại
   - Sau OAuth, người dùng nhận được session token tương đương email login

3. **Session Management**
   - Sau khi login thành công, người dùng nhận được JWT access token + refresh token
   - Access token có thời hạn ngắn (15 phút)
   - Refresh token có thời hạn dài (7 ngày)
   - Logout sẽ invalidate cả hai token

4. **Password Reset**
   - Người dùng có thể yêu cầu reset password qua email
   - Reset link có thời hạn 1 giờ
   - Mỗi reset link chỉ được dùng một lần

---

## UX Expectations

- **Login flow**: User nhập email/password → submit → loading state → redirect to dashboard (hoặc show error)
- **Google OAuth flow**: Click "Continue with Google" → Google consent screen → redirect back → loading → dashboard
- **Error states**:
  - Wrong password: "Email hoặc mật khẩu không đúng" (không tiết lộ email có tồn tại không)
  - Email not found: Cùng message với wrong password (security)
  - Rate limit: "Quá nhiều lần thử. Vui lòng thử lại sau X phút"
- **Remember me**: Option để extend session lên 30 ngày
- **Redirect after login**: Redirect về trang user muốn vào trước khi bị redirect sang login

---

## Edge Cases

| Case | Expected Behavior |
|---|---|
| Email đã dùng Google OAuth, nay login bằng email/password | Show message: "Tài khoản này đăng nhập bằng Google. Vui lòng dùng Google Sign In." |
| Email đã đăng ký email/password, nay login bằng Google (cùng email) | Tự động link accounts, login thành công |
| Refresh token hết hạn | Redirect về login page với message "Phiên đăng nhập đã hết hạn" |
| Nhiều tab cùng login | Tất cả tab share cùng session |
| Login trên device mới khi đã login ở device cũ | Cho phép đồng thời (không force logout device cũ) |
| CSRF attack | Toàn bộ state-changing requests phải có CSRF protection |

---

## Security Expectations

- Password phải hash bằng **bcrypt** (cost factor ≥ 12)
- JWT phải ký bằng **RS256** (asymmetric) — không dùng HS256
- Rate limiting: Tối đa **5 lần thử** trong 15 phút mỗi IP/email
- Refresh token phải được lưu trong **httpOnly cookie** — không được expose ra JavaScript
- Access token có thể lưu in-memory (không localStorage)
- Toàn bộ auth endpoints phải qua **HTTPS**
- Google OAuth callback URL phải được whitelist

---

## Out of Scope (cho intent này)

- Two-factor authentication (2FA) → sẽ là intent riêng: AUTH_002
- Social login khác (Facebook, GitHub) → intent riêng
- SAML/SSO enterprise → intent riêng
- Role-based access control (RBAC) → USER_PERMISSIONS_001
