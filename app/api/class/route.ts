import { NextResponse } from "next/server";
import { ClassService } from '../../services/class'

export async function GET(){
    try{
        const classes = await ClassService.fetchClasses()
        return NextResponse.json(classes, {status: 200})
    } catch (error: any){
        console.error("Lỗi GET/api/class")
        return NextResponse.json(
        {error: 'Lỗi lấy danh sách lớp'},
        {status: 500 })
    }
}


export async function POST(request: Request){
    try{
    const body = await request.json();
    const { name, short_name, rate_per_session, type, selectedDays, start_time, end_time, valid_from } = body;        
    // Kiểm tra tính hợp lệ sơ bộ của payload dữ liệu
    if (!name || !short_name || !rate_per_session || !type) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc." }, { status: 400 });
    }
    if (type === 'FIXED' && (!selectedDays || selectedDays.length === 0)) {
    return NextResponse.json({ error: "Lớp học cố định cần chọn ít nhất 1 ngày trong tuần." }, { status: 400 });
    }

    await ClassService.createClass({
    name, short_name, rate_per_session, type, selectedDays, start_time, end_time, valid_from
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
    const body = await request.json();
    const { classId, editSelectedDays, editValidFrom, editStartTime, editEndTime } = body;

    if (!classId || !editSelectedDays || editSelectedDays.length === 0) {
      return NextResponse.json({ error: "Dữ liệu cập nhật không hợp lệ." }, { status: 400 });
    }

    await ClassService.changeSchedule({
      classId, editSelectedDays, editValidFrom, editStartTime, editEndTime
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID lớp học cần xóa." }, { status: 400 });
    }

    await ClassService.deleteClass(Number(id));
    return NextResponse.json({ success: true, message: "Xóa lớp học thành công!" }, { status: 200 });
  } catch (error: any) {
    console.error("Lỗi DELETE /api/class:", error);
    return NextResponse.json(
      { error: error.message || "Có lỗi xảy ra khi xóa lớp học." }, 
      { status: 500 }
    );
  }
}