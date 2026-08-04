import { NextResponse } from 'next/server';
import { handleCorsOptions, corsHeaders } from '@/lib/openclaw-auth';

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function GET(request: Request) {
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}/api/v1/openclaw`;

  const openApiSpec = {
    openapi: '3.0.3',
    info: {
      title: 'SPeanut OpenClaw API',
      description: 'API dành riêng cho OpenClaw Agent kết nối và tương tác với hệ thống quản lý lịch dạy và bảng lương SPeanut.',
      version: '1.0.0',
    },
    servers: [
      {
        url: baseUrl,
        description: 'SPeanut OpenClaw API Server',
      },
    ],
    security: [
      {
        BearerAuth: [],
      },
      {
        ApiKeyAuth: [],
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API_KEY',
          description: 'Truyền API Key vào Authorization Header theo định dạng: Bearer <API_KEY>',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'Truyền API Key vào Header x-api-key',
        },
      },
    },
    paths: {
      '/summary': {
        get: {
          summary: 'Lấy tổng quan thông tin trong ngày và tháng hiện tại',
          description: 'Trả về lịch dạy hôm nay, tổng số buổi học trong tháng, tổng thù lao dạy tạm tính và tổng thu nhập phụ trợ.',
          responses: {
            '200': {
              description: 'Thành công',
            },
            '401': {
              description: 'API Key không hợp lệ',
            },
          },
        },
      },
      '/schedule': {
        get: {
          summary: 'Lấy lịch dạy theo khoảng thời gian',
          parameters: [
            {
              name: 'startDate',
              in: 'query',
              required: false,
              schema: { type: 'string', format: 'date' },
              description: 'Ngày bắt đầu (YYYY-MM-DD). Mặc định là Thứ Hai tuần này.',
            },
            {
              name: 'endDate',
              in: 'query',
              required: false,
              schema: { type: 'string', format: 'date' },
              description: 'Ngày kết thúc (YYYY-MM-DD). Mặc định là Chủ Nhật tuần này.',
            },
          ],
          responses: {
            '200': { description: 'Thành công' },
          },
        },
      },
      '/attendance': {
        post: {
          summary: 'Điểm danh hoặc cập nhật trạng thái buổi học',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['class_id'],
                  properties: {
                    class_id: { type: 'integer', description: 'ID lớp học hoặc tên lớp/viết tắt' },
                    class_name: { type: 'string', description: 'Tên lớp học (nếu không dùng class_id)' },
                    date: { type: 'string', format: 'date', description: 'Ngày học (YYYY-MM-DD). Mặc định là hôm nay.' },
                    status: { type: 'string', enum: ['ATTENDED', 'OFF', 'EXTRA'], description: 'Trạng thái: ATTENDED (Đã dạy), OFF (Báo nghỉ), EXTRA (Dạy thêm/bù)' },
                    note: { type: 'string', description: 'Ghi chú cho buổi dạy' },
                    start_time: { type: 'string', description: 'Giờ bắt đầu (nếu là lớp dạy thêm)' },
                    end_time: { type: 'string', description: 'Giờ kết thúc (nếu là lớp dạy thêm)' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Điểm danh thành công' },
          },
        },
      },
      '/salary': {
        get: {
          summary: 'Xem thống kê bảng lương và thu nhập theo khoảng thời gian hoặc theo tháng',
          parameters: [
            {
              name: 'startDate',
              in: 'query',
              required: false,
              schema: { type: 'string', format: 'date' },
              description: 'Ngày bắt đầu (YYYY-MM-DD). Ví dụ: 2026-07-21.',
            },
            {
              name: 'endDate',
              in: 'query',
              required: false,
              schema: { type: 'string', format: 'date' },
              description: 'Ngày kết thúc (YYYY-MM-DD). Ví dụ: 2026-08-04.',
            },
            {
              name: 'month',
              in: 'query',
              required: false,
              schema: { type: 'integer', minimum: 1, maximum: 12 },
              description: 'Tháng cần tra cứu (1-12) (nếu không dùng startDate/endDate).',
            },
            {
              name: 'year',
              in: 'query',
              required: false,
              schema: { type: 'integer' },
              description: 'Năm cần tra cứu (ví dụ: 2026).',
            },
          ],
          responses: {
            '200': { description: 'Thành công' },
          },
        },
        post: {
          summary: 'Thêm khoản thu nhập phụ (Trợ giảng, làm đề, chấm bài)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'amount'],
                  properties: {
                    name: { type: 'string', description: 'Tên khoản thu ngoài (Ví dụ: Chấm bài thi thử)' },
                    amount: { type: 'number', description: 'Số tiền thu ngoài (VND). Ví dụ: 300000' },
                    month: { type: 'integer', description: 'Tháng áp dụng (1-12). Mặc định là tháng hiện tại' },
                    year: { type: 'integer', description: 'Năm áp dụng. Mặc định là năm hiện tại' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Ghi nhận thu nhập phụ thành công' },
          },
        },
      },
      '/profile': {
        get: {
          summary: 'Xem thông tin cá nhân và tài khoản ngân hàng',
          responses: {
            '200': { description: 'Thành công' },
          },
        },
        put: {
          summary: 'Cập nhật thông tin cá nhân và tài khoản nhận lương',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    full_name: { type: 'string', description: 'Họ và tên' },
                    bank_brand: { type: 'string', description: 'Tên ngân hàng (Ví dụ: Vietcombank)' },
                    bank_number: { type: 'string', description: 'Số tài khoản ngân hàng' },
                    bank_owner: { type: 'string', description: 'Tên chủ tài khoản' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Cập nhật thông tin thành công' },
          },
        },
      },
      '/classes': {
        get: {
          summary: 'Lấy danh sách tất cả các lớp học hiện có',
          responses: {
            '200': { description: 'Thành công' },
          },
        },
        post: {
          summary: 'Tạo lớp học mới',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'short_name', 'rate_per_session'],
                  properties: {
                    name: { type: 'string', description: 'Tên lớp học (Ví dụ: Toán 11 cơ bản)' },
                    short_name: { type: 'string', description: 'Tên viết tắt của lớp (Ví dụ: T11)' },
                    rate_per_session: { type: 'number', description: 'Thù lao cho 1 buổi dạy (VND) (Ví dụ: 250000)' },
                    type: { type: 'string', enum: ['FIXED', 'EXTRA'], description: 'Phân loại lớp' },
                    days_of_week: { type: 'array', items: { type: 'string' }, description: 'Các thứ học trong tuần (Ví dụ: ["thứ 3", "thứ 5"] hoặc [2, 4])' },
                    valid_from: { type: 'string', format: 'date', description: 'Ngày bắt đầu áp dụng thời khóa biểu (YYYY-MM-DD). Ví dụ: 2026-09-01' },
                    start_time: { type: 'string', description: 'Giờ bắt đầu học (HH:MM). Mặc định là 18:00' },
                    end_time: { type: 'string', description: 'Giờ kết thúc học (HH:MM). Mặc định là 19:30' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Tạo lớp thành công' },
          },
        },
      },
    },
  };

  return NextResponse.json(openApiSpec, { status: 200, headers: corsHeaders });
}
