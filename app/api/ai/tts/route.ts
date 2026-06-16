import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server";

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Phiên đăng nhập hết hạn hoặc chưa đăng nhập." }, { status: 401 });
    }

    const { text } = await request.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Nội dung cần đọc trống." }, { status: 400 });
    }

    // Lấy 9Router URL và KEY từ env hoặc từ client header truyền lên
    const ninerouterUrl = process.env.NINEROUTER_URL || request.headers.get("x-ninerouter-url");
    const ninerouterKey = process.env.NINEROUTER_KEY || request.headers.get("x-ninerouter-key");

    if (!ninerouterUrl) {
      return NextResponse.json({
        error: "NINEROUTER_URL is missing",
        message: "Chưa cấu hình 9Router URL. Bạn có thể thiết lập trong cài đặt (bấm icon Bánh răng)."
      }, { status: 400 });
    }

    const endpoint = `${ninerouterUrl.replace(/\/$/, "")}/v1/audio/speech`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (ninerouterKey) {
      headers["Authorization"] = `Bearer ${ninerouterKey}`;
    }

    // Gửi yêu cầu sinh TTS đến 9Router
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "edge-tts/vi-VN-HoaiMyNeural", // Voice Việt Nam chất lượng tự nhiên
        input: text.trim()
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`9Router TTS returned error: ${res.status} ${errorText}`);
    }

    // Lấy dữ liệu nhị phân của file audio MP3
    const audioBuffer = await res.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mp3",
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch (error: any) {
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error(`[AI Connect Error] ${error.code}: Failed to reach 9Router endpoint for TTS.`);
    } else {
      console.error("Lỗi POST /api/ai/tts:", error);
    }
    
    let friendlyMessage = error.message || "Có lỗi xảy ra khi xử lý giọng nói.";
    if (error.code === 'ENOTFOUND') {
      friendlyMessage = "Không thể tìm thấy địa chỉ máy chủ 9Router (Lỗi DNS ENOTFOUND). Vui lòng cấu hình lại URL trong Cài đặt.";
    } else if (error.code === 'ECONNREFUSED') {
      friendlyMessage = "Kết nối tới máy chủ 9Router bị từ chối (Lỗi ECONNREFUSED). Hãy chắc chắn rằng máy chủ 9Router đang chạy.";
    }
    
    return NextResponse.json({ error: "Lỗi kết nối", message: friendlyMessage }, { status: 500 });
  }
}
