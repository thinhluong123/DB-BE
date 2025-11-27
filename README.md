# Backend System

Hệ thống Backend API sử dụng Node.js, Express và MySQL.

## Yêu cầu

- [Node.js](https://nodejs.org/) (Khuyên dùng bản LTS)
- MySQL Server

## Cài đặt

1. Clone dự án và di chuyển vào thư mục backend:

   ```bash
   cd backend
   ```

2. Cài đặt các thư viện:
   ```bash
   npm install
   ```

## Cấu hình

1. Tạo file môi trường `.env` từ file mẫu:

   - Trên Windows (CMD/PowerShell):
     ```bash
     copy env.example .env
     ```
   - Trên Linux/Mac:
     ```bash
     cp env.example .env
     ```

2. Mở file `.env` và cập nhật thông tin cấu hình cho phù hợp với máy của bạn:

   ```env
   # Server Port
   PORT=3001

   # Database (MySQL)
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=btl2

   # Security
   JWT_SECRET=your_super_secret_key
   ```

## Chạy dự án

  ```bash
  npm run dev
  ```

Server sẽ chạy tại: `http://localhost:3001` (hoặc port bạn đã cấu hình).
