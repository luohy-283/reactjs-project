# Hệ thống Đặt phòng họp — Frontend (Tuần 1)

React + TypeScript + Vite + Ant Design + React Router + Axios.

Phạm vi hiện tại: **Tuần 1 — Khởi tạo & Luồng đăng nhập** (mục 4.1 tài liệu gốc).

## Chạy dự án

```bash
npm install
npm run dev
```

Yêu cầu Node.js >= 20 (Ant Design v6).

## Tài khoản mock

| Email | Mật khẩu | Role |
| --- | --- | --- |
| `admin@company.com` | `123456` | ADMIN |
| `user@company.com` | `123456` | USER |

## Cấu trúc thư mục

```
src/
  api/auth/       # Login service
  components/     # Layout, guards, listeners
  context/        # AuthContext
  lib/            # api-client, mockApi, auth-events
  pages/          # Login, Dashboard (placeholder)
```

## Luồng Tuần 1

- **Login** (`/login`): form AntD, gọi `mockLogin` qua `api/auth/auth.service.ts`
- **JWT**: lưu token + user vào `localStorage` qua `AuthContext`
- **Axios interceptor**: gắn `Authorization: Bearer <token>`, bắt 401 → logout + redirect `/login`
- **Protected routes**: chưa đăng nhập → `/login`; đã đăng nhập → `/dashboard`

## Kết nối Backend thật

Thay implementation trong `src/api/auth/auth.service.ts` bằng `apiClient.post("/auth/login", ...)`.

## Scripts

- `npm run dev` — chạy dev server
- `npm run build` — build production
- `npm run lint` — ESLint
