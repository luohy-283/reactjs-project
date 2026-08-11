# Hệ thống Đặt phòng họp — Frontend

React + TypeScript + Vite + Ant Design + React Router + Axios.

Xem `AGENTS.md` để biết conventions cho coding agents.

## Chạy dự án

```bash
npm install
npm run dev
```

Yêu cầu Node.js >= 20 (Ant Design v6).

## Tài khoản seed

| Email | Mật khẩu | Role |
| --- | --- | --- |
| `admin@company.com` | `123456` | ADMIN |
| `user@company.com` | `123456` | USER |

## Cấu trúc thư mục

```
src/
  app/          # Providers, router, layouts, route guards, Dashboard schedule
  features/     # auth, rooms, bookings, users, departments, invoices, revenue, …
                # mỗi feature: api/ (service + hooks) + components/
  components/   # layouts/ (Topbar, Sidebar, …) + ui/ (page, table, search, …)
  lib/          # api-client, auth-events, shared types/helpers
```

## Luồng chính

- **Login** (`/login`): `AuthContext.login()` → `features/auth/api/auth.service.ts`
- **Dashboard** (`/dashboard`): `useRoomSchedule` (`app/hooks/use-room-schedule.ts`) + modal đặt phòng
- **Admin phòng** (`/admin/rooms`): `useRoomsPage` + CRUD qua `features/rooms/api/`

## Kết nối Backend

HTTP qua `apiClient` (`src/lib/api-client.ts`) → `VITE_API_BASE_URL` (mặc định `http://localhost:8080/api`).
Feature UI gọi `features/*/api/*.service.ts`, không gọi raw Axios trực tiếp.

## Scripts

- `npm run dev` — chạy dev server
- `npm run build` — build production
- `npm run lint` — ESLint
