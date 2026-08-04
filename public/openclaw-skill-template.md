---
name: speanut-assistant
description: "Tương tác với hệ thống quản lý lịch dạy SPeanut để xem lịch dạy hôm nay, kiểm tra bảng lương, thực hiện điểm danh và quản lý các lớp học."
---

# OpenClaw Skill: SPeanut Assistant

Skill này cho phép OpenClaw tự động tương tác với hệ thống **SPeanut** của bạn thông qua RESTful API.

## Cấu hình kết nối (Environment / Configuration)

- **Base URL**: `https://s-peanut.vercel.app/api/v1/openclaw` *(hoặc `http://localhost:3000/api/v1/openclaw` khi chạy local)*
- **Headers**:
  - `Authorization`: `Bearer speanut_sk_openclaw_2026`
  - `Content-Type`: `application/json`
  - `x-user-email`: `lanhuong04011643@gmail.com`

---

## Danh sách Tools / API Capability

### 1. `get_speanut_summary`
- **Mô tả**: Lấy tổng quan nhanh về lịch dạy hôm nay, tổng số buổi học và tổng thù lao/lương tạm tính của tháng hiện tại.
- **HTTP**: `GET /summary`
- **Khi nào dùng**: Khi người dùng hỏi "Hôm nay tôi có lịch dạy không?", "Tóm tắt tình hình dạy học hôm nay", "Tổng quan tháng này".

---

### 2. `get_speanut_schedule`
- **Mô tả**: Lấy danh sách lịch dạy chi tiết theo khoảng thời gian.
- **HTTP**: `GET /schedule?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- **Khi nào dùng**: Khi người dùng hỏi "Lịch dạy tuần này của tôi thế nào?", "Lịch dạy ngày mai", "Lịch dạy từ 2026-07-01 đến 2026-07-15".

---

### 3. `mark_speanut_attendance`
- **Mô tả**: Điểm danh hoặc cập nhật nhật ký giảng dạy cho một lớp học.
- **HTTP**: `POST /attendance`
- **Body**:
  ```json
  {
    "class_name": "Toán 9 Cơ Bản",
    "date": "2026-07-22",
    "status": "ATTENDED",
    "note": "Hoàn thành bài 5"
  }
  ```
  *(Status gồm: `ATTENDED` - Đã dạy, `OFF` - Báo nghỉ, `EXTRA` - Dạy thêm/dạy bù)*
- **Khi nào dùng**: Khi người dùng ra lệnh "Điểm danh hôm nay tôi đã dạy lớp Toán 9", "Hôm nay tôi nghỉ lớp Lý 10", "Ghi nhận buổi dạy bù hôm nay".

---

### 4. `get_speanut_salary`
- **Mô tả**: Tra cứu thống kê chi tiết thù lao, tổng số buổi thực dạy và tổng thu nhập theo khoảng thời gian hoặc theo tháng.
- **HTTP**: `GET /salary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` *(hoặc `GET /salary?month=8&year=2026`)*
- **Khi nào dùng**: Khi người dùng hỏi "Từ 21/07 đến nay tôi được bao nhiêu lương và bao nhiêu buổi?", "Lương tháng này của tôi là bao nhiêu?", "Chi tiết thù lao tháng 8 năm 2026".

---

### 5. `list_speanut_classes`
- **Mô tả**: Trả về danh sách tất cả các lớp học hiện có và mức thù lao cho 1 buổi dạy.
- **HTTP**: `GET /classes`
- **Khi nào dùng**: Khi người dùng hỏi "Tôi đang quản lý những lớp học nào?", "Mức thù lao các lớp".
