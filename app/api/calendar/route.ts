import { NextResponse } from 'next/server';
import { CalendarService } from '../../services/calendar';
import { createClient } from "@/lib/server";

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

        const data = await CalendarService.fetchCalendarData(userId);
        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error("Lỗi GET /api/calendar:", error);
        return NextResponse.json({ error: 'Lỗi lấy lịch dạy học' }, { status: 500 });
    }
}