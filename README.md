# Hệ thống Đặt phòng họp — Frontend

React + TypeScript + Vite + Ant Design + React Router + Axios.

Xem `AGENTS.md` để biết conventions cho coding agents.

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
  api/          # Service layer (auth, rooms) + hooks
  components/   # Layout, guards, listeners
  context/      # AuthContext
  lib/          # api-client, mockApi, auth-events
  pages/        # Login, Dashboard, AdminRooms
```

## Luồng chính

- **Login** (`/login`): `AuthContext.login()` → `api/auth/auth.service.ts`
- **Dashboard** (`/dashboard`): xác nhận đăng nhập thành công
- **Admin** (`/admin/rooms`): `useRooms` hook + CRUD qua `api/rooms/`

## Kết nối Backend thật

Thay implementation trong `src/api/*/*.service.ts` bằng `apiClient` từ `src/lib/api-client.ts`. Giữ nguyên interface — pages/hooks không đổi.

## Scripts

- `npm run dev` — chạy dev server
- `npm run build` — build production
- `npm run lint` — ESLint
