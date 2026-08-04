---
name: speanut-assistant
description: "Quản lý lịch dạy, bảng lương và điểm danh SPeanut cho trợ giảng."
---

- **Base URL**: `https://s-peanut.vercel.app/api/v1/openclaw`
- **OpenAPI Schema**: `https://s-peanut.vercel.app/api/v1/openclaw/openapi.json`
- **Headers**:
  - `Authorization`: `Bearer speanut_sk_openclaw_2026`
  - `Content-Type`: `application/json`
  - `x-user-email`: `lanhuong04011643@gmail.com`

---

## Capabilities / Tools

1. **GET /summary**: Tóm tắt lịch dạy hôm nay và tổng thù lao tháng.
2. **GET /schedule?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD**: Xem lịch dạy chi tiết theo ngày.
3. **GET /salary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD**: Tra cứu tổng thù lao và số buổi dạy theo khoảng thời gian tùy chọn hoặc theo tháng.
4. **POST /attendance**: Điểm danh (`ATTENDED`), báo nghỉ (`OFF`), dạy thêm (`EXTRA`).
5. **GET /classes** & **POST /classes**: Xem hoặc tạo lớp học mới.
