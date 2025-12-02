## Backend ITviec clone (Candidate & Employer)

Backend Node.js + Express, MySQL, kiến trúc gần MVC, phục vụ cho frontend trong thư mục `DB-FE`.

### 1. Chạy backend

- Yêu cầu: Node 18+, MySQL đang chạy, đã import schema từ `../btl2.sql` (database `btl2`).
- Vào thư mục `backend` và cài dependency:
  - Nếu dùng PowerShell bị chặn script, hãy mở CMD hoặc terminal khác:
  - `cd backend`
  - `npm install`
- Tạo file `.env` trong `backend/src` hoặc `backend` (tuỳ cách bạn chạy) với nội dung ví dụ:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=btl2
JWT_SECRET=supersecret
JWT_EXPIRES_IN=7d
PORT=3001
```

- Chạy dev:

```bash
npm run dev
```

Server sẽ lắng nghe tại `http://localhost:3001`.

### 2. Cấu trúc chính

- `src/app.js`: khởi tạo Express app, middlewares, mount `/api`.
- `src/server.js`: khởi động HTTP server, init kết nối MySQL.
- `src/config/db.js`: kết nối & pool MySQL (dùng `mysql2/promise`).
- `src/middlewares`:
  - `authMiddleware.js`: verify JWT, phân quyền `CANDIDATE` / `EMPLOYER`.
  - `errorHandler.js`: 404 + error handler chung.
  - `validate.js`: validate đơn giản cho pagination.
- `src/utils`: `response.js`, `pagination.js`.
- `src/models`: các hàm truy cập DB cho `user`, `candidate`, `employer`.
- `src/controllers`: logic cho từng nhóm API (auth, employer, job, candidate, stats, application).
- `src/routes`:
  - `auth.routes.js`: `/api/auth/*`
  - `employer.routes.js`: `/api/employer/*`
  - `job.routes.js`: `/api/jobs/*`
  - `candidate.routes.js`: `/api/candidate/*`
  - `application.routes.js`: `/api/applications/*`
  - `index.js`: gộp tất cả vào `/api`.

### 3. Nhóm endpoint chính (bám theo các file spec)

- **Employer dashboard** (`api_need for dashboard.md`):
  - `GET /api/employer/:employerId/stats`
  - `GET /api/employer/:employerId/jobs`
  - `GET /api/jobs/:jobId/applications`
  - `GET /api/employer/:employerId/saved-candidates`
  - `POST /api/jobs`
  - `PATCH /api/jobs/:jobId/status`
  - `DELETE /api/jobs/:jobId`
  - `PATCH /api/applications/:jobId/:candidateId/status`
  - `POST /api/employer/:employerId/follow/:candidateId`
  - `DELETE /api/employer/:employerId/follow/:candidateId`
  - `GET /api/employer/:employerId/notifications`
  - `GET /api/employer/:employerId`
  - `GET /api/employer/:employerId/company`

- **Public & job APIs** (`api-needed.md`):
  - `GET /api/stats`
  - `GET /api/categories`
  - `GET /api/companies/top`
  - `GET /api/jobs`
  - `GET /api/jobs/:jobId`
  - `POST /api/jobs/:jobId/favorite`
  - `POST /api/jobs/:jobId/apply`
  - `GET /api/jobs/:jobId/check-status`
  - `GET /api/candidate/dashboard`
  - `POST /api/candidate/logout`
  - `GET /api/candidate/applications`

- **Candidate profile** (`api_need for profile.md`):
  - `GET /api/candidate/profile`
  - `PUT /api/candidate/profile`
  - `POST /api/candidate/avatar`
  - `GET /api/candidate/resumes`
  - `POST /api/candidate/resumes`
  - `DELETE /api/candidate/resumes/:id`
  - `PUT /api/candidate/password`
  - `GET /api/candidate/notifications`
  - `PUT /api/candidate/notifications/:id/read`
  - `PUT /api/candidate/notifications/read-all`
  - `DELETE /api/candidate/notifications/:id`
  - `GET /api/candidate/notifications/unread`

### 4. Auth & tích hợp với frontend

- Đăng ký: `POST /api/auth/register` (body có `role: "CANDIDATE" | "EMPLOYER"`).
- Đăng nhập: `POST /api/auth/login` → trả về `{ token, role }`.
- FE cần lưu `token` (ví dụ `localStorage.authToken`) rồi gửi kèm header:

```http
Authorization: Bearer <token>
```

- Các service trong `DB-FE/src/services/*.js` có thể trỏ `REACT_APP_API_URL=http://localhost:5000/api`.


