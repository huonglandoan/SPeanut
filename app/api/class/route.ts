import { NextResponse } from "next/server";
import { ClassService } from '../../services/class';
import { createClient } from "@/lib/server"; // [QUAN TRỌNG] Import helper Server mới của bạn

// Hàm trợ giúp kiểm tra phiên đăng nhập và trả về userId một cách an toàn
async function getAuthenticatedUserId() {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    return user?.id || null;
}

export async function GET() {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Phiên đăng nhập hết hạn hoặc chưa đăng nhập.' }, { status: 401 });
        }

        // Truyền userId vào service để chỉ lấy đúng các lớp của giảng viên này
        const classes = await ClassService.fetchClasses(userId);
        return NextResponse.json(classes, { status: 200 });
    } catch (error: any) {
        console.error("Lỗi GET /api/class:", error);
        return NextResponse.json({ error: 'Lỗi lấy danh sách lớp' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Hành động trái phép.' }, { status: 401 });
        }

        const body = await request.json();
        const { name, short_name, rate_per_session, type, selectedDays, start_time, end_time, valid_from } = body;        
        
        if (!name || !short_name || !rate_per_session || !type) {
            return NextResponse.json({ error: "Thiếu thông tin bắt buộc." }, { status: 400 });
        }
        if (type === 'FIXED' && (!selectedDays || selectedDays.length === 0)) {
            return NextResponse.json({ error: "Lớp học cố định cần chọn ít nhất 1 ngày trong tuần." }, { status: 400 });
        }

        // Bổ sung thêm userId để gán vào cột user_id lúc lưu xuống DB
        await ClassService.createClass({
            userId, name, short_name, rate_per_session, type, selectedDays, start_time, end_time, valid_from
        });
        return NextResponse.json({ success: true, message: "Tạo lớp học thành công!" }, { status: 201 });
    } catch (error: any) {
        console.error("Lỗi POST /api/class:", error);
        return NextResponse.json(
            { error: error.message || "Có lỗi xảy ra khi tạo lớp học." }, 
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Hành động trái phép.' }, { status: 401 });
        }

        const body = await request.json();
        const { classId, editSelectedDays, editValidFrom, editStartTime, editEndTime } = body;

        if (!classId || !editSelectedDays || editSelectedDays.length === 0) {
            return NextResponse.json({ error: "Dữ liệu cập nhật không hợp lệ." }, { status: 400 });
        }

        // Gửi kèm userId để check quyền: Tránh việc userA gửi request sửa trộm lịch của userB
        await ClassService.changeSchedule({
            classId, userId, editSelectedDays, editValidFrom, editStartTime, editEndTime
        });

        return NextResponse.json({ success: true, message: "Cập nhật lịch thành công!" }, { status: 200 });
    } catch (error: any) {
        console.error("Lỗi PATCH /api/class:", error);
        return NextResponse.json(
            { error: error.message || "Có lỗi xảy ra khi cập nhật lịch." }, 
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Hành động trái phép.' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Thiếu ID lớp học cần xóa." }, { status: 400 });
        }

        // Gửi kèm userId để bảo vệ: Chỉ chính chủ lớp học mới có quyền ra lệnh xóa
        await ClassService.deleteClass(Number(id), userId);
        return NextResponse.json({ success: true, message: "Xóa lớp học thành công!" }, { status: 200 });
    } catch (error: any) {
        console.error("Lỗi DELETE /api/class:", error);
        return NextResponse.json(
            { error: error.message || "Có lỗi xảy ra khi xóa lớp học." }, 
            { status: 500 }
        );
    }
}