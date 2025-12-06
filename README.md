## Backend API Endpoints Đã Implement

Base URL: `/api`

---

### 1. Public (Homepage)

- `GET /api/stats`

  - Mô tả: Lấy thống kê tổng quan cho homepage (Live Job, Companies, Candidates, New Jobs, Successful Hires).
  - Trả về: **mảng** các object `{ icon, number, label }`.

- `GET /api/categories`

  - Mô tả: Lấy danh sách category công việc với số lượng job đang mở.
  - Trả về: **mảng** `{ id, icon, name, openPositions, specialty }`.

- `GET /api/companies/top`
  - Mô tả: Lấy danh sách công ty nổi bật cho homepage, sắp xếp theo TrustScore.
  - Query: `limit` (optional, default 8).
  - Trả về: **mảng** `{ CompanyID, CompanyName, Logo, CompanySize, Website, Description, Industry, CNationality, openPositions, rating, EmployerID, TrustScore, AvgReview, TotalReview, FollowerCount }`.

---

### 2. Authentication

#### 2.1. Candidate Authentication

- `POST /api/auth/register-candidate`

  - Mô tả: Đăng ký tài khoản **ứng viên**.
  - Body:
    ```json
    {
      "fullName": "Nguyen Van A",
      "username": "candidate1",
      "email": "user@email.com",
      "password": "123456",
      "address": "Hà Nội",
      "phone": "0123456789",
      "Profile_Picture": "https://...",
      "Bdate": "2000-01-01"
    }
    ```
  - Tác động DB:
    - Insert vào bảng `user`.
    - Insert vào bảng `candidate` (ID = ID user).
  - Trả về:
    ```json
    {
      "success": true,
      "data": {
        "token": "jwt-token",
        "user": {
          "id": 1,
          "username": "candidate1",
          "email": "user@email.com",
          "fullName": "Nguyen Van A",
          "role": "candidate",
          "candidateId": 1,
          "employerId": null
        },
        "role": "candidate"
      },
      "message": "Đăng ký thành công"
    }
    ```

- `POST /api/auth/login-candidate`
  - Mô tả: Đăng nhập với tài khoản **ứng viên**.
  - Body:
    ```json
    {
      "email": "user@email.com",
      "password": "123456"
    }
    ```
  - Trả về:
    ```json
    {
      "success": true,
      "data": {
        "token": "jwt-token",
        "user": {
          "id": 1,
          "username": "candidate1",
          "email": "user@email.com",
          "fullName": "Nguyen Van A",
          "role": "candidate",
          "candidateId": 1,
          "employerId": null
        },
        "role": "candidate"
      },
      "message": "Đăng nhập thành công"
    }
    ```

#### 2.2. Employer Authentication

- `POST /api/auth/register-employer`

  - Mô tả: Đăng ký tài khoản **doanh nghiệp**.
  - Body:
    ```json
    {
      "fullName": "Nguyen Van B",
      "username": "employer1",
      "email": "employer@email.com",
      "password": "123456",
      "address": "Hà Nội",
      "phone": "0123456789",
      "Profile_Picture": "https://...",
      "Bdate": "2000-01-01"
    }
    ```
  - Tác động DB:
    - Insert vào bảng `user`.
    - Insert vào bảng `employer` (ID = ID user).
  - Trả về:
    ```json
    {
      "success": true,
      "data": {
        "token": "jwt-token",
        "user": {
          "id": 2,
          "username": "employer1",
          "email": "employer@email.com",
          "fullName": "Nguyen Van B",
          "role": "employer",
          "candidateId": null,
          "employerId": 2
        },
        "role": "employer"
      },
      "message": "Đăng ký thành công"
    }
    ```

- `POST /api/auth/login-employer`
  - Mô tả: Đăng nhập với tài khoản **doanh nghiệp**.
  - Body:
    ```json
    {
      "email": "employer@email.com",
      "password": "123456"
    }
    ```
  - Trả về:
    ```json
    {
      "success": true,
      "data": {
        "token": "jwt-token",
        "user": {
          "id": 2,
          "username": "employer1",
          "email": "employer@email.com",
          "fullName": "Nguyen Van B",
          "role": "employer",
          "candidateId": null,
          "employerId": 2
        },
        "role": "employer"
      },
      "message": "Đăng nhập thành công"
    }
    ```

#### 2.3. Common Authentication

- `POST /api/auth/logout`

  - Mô tả: Logout (stateless JWT – chủ yếu để frontend clear token).

- `GET /api/auth/profile`
  - Headers: `Authorization: Bearer {token}`
  - Trả về thông tin user hiện tại (id, username, email, role, candidateId/employerId).

> Lưu ý: Backend không có `/api/notifications/unread-count`, nên gọi vào sẽ 404.

---

### 3. Jobs (Công việc)

Base: `/api/jobs`

- `GET /api/jobs`

  - Mô tả: Lấy danh sách job (cho trang tìm việc).
  - Query (tùy theo service hiện tại):
    - `page`, `limit`
    - có thể thêm `keyword`, `location`, `jobType`, `contractType`, `level` (tùy frontend sử dụng).
  - Trả về dạng:
    ```json
    {
      "success": true,
      "data": {
        "jobs": [ ... ],
        "pagination": { ... }
      }
    }
    ```

- `GET /api/jobs/:jobId`

  - Mô tả: Lấy chi tiết 1 job (cho trang JobDetails / Apply).

- `POST /api/jobs`

  - Mô tả: Nhà tuyển dụng đăng job mới.
  - Body (theo schema `job` + `categories` + `skills`).
  - Tạo bản ghi trong `job`, và các quan hệ trong bảng `in` (job_category) & `require` (skill).

- `PATCH /api/jobs/:jobId/status`

  - Mô tả: Cập nhật trạng thái job (Active/Expired/Closed...).

- `DELETE /api/jobs/:jobId`

  - Mô tả: Xóa tin tuyển dụng.

- `GET /api/jobs/:jobId/applications`
  - Mô tả: Lấy danh sách ứng tuyển cho job (cho Employer xem ứng viên).

#### 3.1. Favorite / Apply / Check status (Candidate)

- `POST /api/jobs/:jobId/favorite`

  - Mô tả: Ứng viên **yêu thích** job.
  - Body: `{ CandidateID: number }` hoặc lấy từ user/token (tùy cách gọi).
  - DB: insert vào `favourite`.

- `DELETE /api/jobs/:jobId/favorite`

  - Mô tả: Bỏ yêu thích job.

- `POST /api/jobs/:jobId/apply`

  - Mô tả: Ứng viên apply job.
  - Body: `{ CandidateID, CoverLetter, upLoadCV, ... }`.
  - DB: insert/update bảng `apply`.

- `GET /api/jobs/:jobId/check-status`
  - Mô tả: Xem trạng thái của ứng viên với job đó (đã favorite/apply chưa, có thể apply không).
  - Trả về:
    ```json
    {
      "JobID": 1,
      "favorited": true,
      "applied": false,
      "canApply": true,
      "applicationDeadline": "2025-12-25"
    }
    ```

---

### 4. Candidate APIs

Base: `/api/candidate`

- `GET /api/candidate/dashboard`

  - Mô tả: Dashboard ứng viên (thông tin user, stats, recent applications).
  - Input: `{ candidateId }` (từ token/body).

- `POST /api/candidate/logout`

  - Mô tả: Endpoint logout cho candidate (frontend cũng có thể chỉ xóa token).

- `GET /api/candidate/applications`

  - Mô tả: Danh sách đơn ứng tuyển của candidate (có phân trang).
  - Query: `page`, `limit`.

- `GET /api/candidate/favorites`
  - Mô tả: Danh sách job yêu thích của candidate.

#### 4.1. Candidate Profile & Settings

- `GET /api/candidate/profile`

  - Mô tả: Lấy full profile ứng viên cho trang hồ sơ (personal info, contact, settings,...).
  - Input: `{ candidateId }` (query/body hoặc lấy từ token).

- `PUT /api/candidate/profile`

  - Mô tả: Cập nhật profile (dùng chung cho các tab, gửi field nào cần update).
  - Body ví dụ:
    ```json
    {
      "candidateId": 1,
      "fullName": "Nguyễn Văn A",
      "location": "Hà Nội",
      "phone": "0909...",
      "dateOfBirth": "1995-05-20"
    }
    ```

- `POST /api/candidate/avatar`

  - Mô tả: Upload/đổi avatar (backend nhận URL/file info, chưa xử lý upload thực).
  - Body ví dụ:
    ```json
    {
      "candidateId": 1,
      "avatar": "https://.../avatar.png"
    }
    ```

- `GET /api/candidate/resumes`

  - Mô tả: Lấy danh sách CV đã lưu của ứng viên (map từ cột `profile.savedCv`).

- `POST /api/candidate/resumes`

  - Mô tả: Upload/thêm CV mới, cập nhật cột `savedCv` trong bảng `profile`.
  - Body ví dụ:
    ```json
    {
      "candidateId": 1,
      "url": "https://.../cv.pdf"
    }
    ```

- `DELETE /api/candidate/resumes/:id`

  - Mô tả: Xóa CV (thực tế đang set `savedCv = NULL` cho candidate).

- `PUT /api/candidate/password`
  - Mô tả: Đổi mật khẩu.
  - Body:
    ```json
    {
      "candidateId": 1,
      "currentPassword": "...",
      "newPassword": "..."
    }
    ```

#### 4.2. Candidate Notifications

- `GET /api/candidate/notifications`

  - Mô tả: Lấy danh sách thông báo của ứng viên (từ bảng `notification`, filter theo `CandidateID`).
  - Query: `page`, `limit`, `type` (hiện type được trả mặc định là `"application"`).

- `PUT /api/candidate/notifications/:id/read`

  - Mô tả: Đánh dấu 1 thông báo đã đọc (hiện chưa có cột trạng thái, đang là no-op).

- `PUT /api/candidate/notifications/read-all`

  - Mô tả: Đánh dấu tất cả là đã đọc (no-op tương tự).

- `DELETE /api/candidate/notifications/:id`

  - Mô tả: Xóa 1 thông báo của ứng viên.

- `GET /api/candidate/notifications/unread`
  - Mô tả: Lấy số lượng thông báo chưa đọc.
  - Hiện tại do chưa có cột `isRead`, backend trả `{ count: 0 }` để tránh lỗi frontend.

---

### 5. Employer APIs

Base: `/api/employer`

- `GET /api/employer/:employerId/stats`

  - Mô tả: Lấy thống kê dashboard nhà tuyển dụng (số job đang mở, followers, applications...).

- `GET /api/employer/:employerId/jobs`

  - Mô tả: Lấy danh sách job của employer (có filter `status`, `page`, `limit`).

- `GET /api/employer/:employerId/saved-candidates`

  - Mô tả: Lấy danh sách ứng viên đã lưu (follow).

- `GET /api/employer/:employerId/notifications`

  - Mô tả: Lấy danh sách notification theo employer (không có unread-count riêng).

- `GET /api/employer/:employerId/company`

  - Mô tả: Lấy thông tin company gắn với employer.

- `GET /api/employer/:employerId`

  - Mô tả: Lấy profile employer (user + package).

- `POST /api/employer/:employerId/follow/:candidateId`

  - Mô tả: Employer follow (lưu) ứng viên.

- `DELETE /api/employer/:employerId/follow/:candidateId`

  - Mô tả: Bỏ follow ứng viên.

- `POST /api/employer/purchase`

  - Mô tả: Employer mua gói dịch vụ (package).
  - Body:
    ```json
    {
      "employerId": 1,
      "packageId": 2
    }
    ```

- `GET /api/employer/:employerId/packages`
  - Mô tả: Lấy danh sách gói dịch vụ mà employer đã mua.
  - Trả về: **mảng** các package với thông tin gói và trạng thái.

---

### 6. Application APIs (Duyệt đơn)

Base: `/api/applications`

- `PATCH /api/applications/:jobId/:candidateId/status`
  - Mô tả: Cập nhật trạng thái đơn ứng tuyển (`Status_apply`: Đang duyệt, Duyệt, Từ chối...).

---

### 7. Package APIs (Gói dịch vụ)

Base: `/api/packages`

- `GET /api/packages`
  - Mô tả: Lấy danh sách tất cả các gói dịch vụ có sẵn cho employer.
  - Trả về: **mảng** `{ PackageID, PackageName, Price, Duration, Features, ... }`.

---

### 8. Payment APIs (Thanh toán)

Base: `/api/payments`

- `POST /api/payments/create-payos-link`

  - Mô tả: Tạo link thanh toán PayOS cho gói dịch vụ.
  - Body:
    ```json
    {
      "orderCode": 123456,
      "amount": 100000,
      "description": "Mua gói Premium",
      "returnUrl": "https://...",
      "cancelUrl": "https://..."
    }
    ```
  - Trả về: Link thanh toán PayOS.

- `GET /api/payments/:orderId/status`
  - Mô tả: Kiểm tra trạng thái thanh toán theo orderId.
  - Trả về: `{ status: "PAID" | "PENDING" | "CANCELLED", ... }`.

---

## Ghi chú

- Tất cả endpoint đều được mount dưới `/api` trong `src/app.js`.
- Một số API yêu cầu **JWT** trong header `Authorization: Bearer {token}` (phía frontend cần tự gắn).
- Chưa có endpoint riêng `GET /api/notifications/unread-count` → nếu frontend gọi sẽ nhận 404 (không phải bug, mà do chưa implement).
