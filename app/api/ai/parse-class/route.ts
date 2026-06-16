import { NextResponse } from "next/server";
import { getAuthenticatedUserId, createClient } from "@/lib/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CalendarService } from "../../../services/calendar";

// Helper function để tính toán trước tiền lương và số buổi học của năm 2026
function calculateSalaryStats(year: number, schedules: any[], cancelledSessions: any, extraIncomes: any) {
  const statsByMonth: Record<number, any> = {};

  for (let month = 1; month <= 12; month++) {
    let fixedCount = 0;
    let extraCount = 0;
    let cancelledCount = 0;
    let totalSalary = 0;
    const classBreakdown: Record<string, any> = {};

    const daysInMonth = new Date(year, month, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dateObj = new Date(year, month - 1, d);
      const dow = dateObj.getDay();

      const activeSchedules = schedules.filter((s: any) => 
        s.day_of_week === dow &&
        s.valid_from <= cellDateStr &&
        (s.valid_to === null || cellDateStr <= s.valid_to)
      );

      activeSchedules.forEach((s: any) => {
        const cancelKey = `${s.class_id}_${cellDateStr}`;
        const isCancelled = !!cancelledSessions[cancelKey];

        if (!classBreakdown[s.name]) {
          classBreakdown[s.name] = {
            activeSessions: 0,
            cancelledSessions: 0,
            earnings: 0,
            rate: s.rate_per_session
          };
        }

        if (isCancelled) {
          cancelledCount += 1;
          classBreakdown[s.name].cancelledSessions += 1;
        } else {
          if (s.type === 'FIXED') {
            fixedCount += 1;
          } else {
            extraCount += 1;
          }
          totalSalary += s.rate_per_session;
          classBreakdown[s.name].activeSessions += 1;
          classBreakdown[s.name].earnings += s.rate_per_session;
        }
      });
    }

    const dbKey = `${year}_${month}`;
    const monthExtraIncomes = extraIncomes[dbKey] || [];
    const totalExtra = monthExtraIncomes
      .filter((item: any) => item.status !== 'rejected')
      .reduce((sum: number, item: any) => sum + item.amount, 0);

    statsByMonth[month] = {
      fixedCount,
      extraCount,
      cancelledCount,
      totalActiveSessions: fixedCount + extraCount,
      baseSalary: totalSalary,
      totalExtraIncome: totalExtra,
      finalSalary: totalSalary + totalExtra,
      classBreakdown,
      extraIncomesList: monthExtraIncomes
    };
  }

  return statsByMonth;
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Phiên đăng nhập hết hạn hoặc chưa đăng nhập." }, { status: 401 });
    }

    const { message, currentPayload, isDemoMode, demoClasses } = await request.json();
    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Nội dung tin nhắn trống." }, { status: 400 });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // 1. Lấy dữ liệu xây dựng ngữ cảnh (Context) cho AI
    let dbContext: any = {};
    let stats2026 = {};

    if (isDemoMode) {
      // Chế độ Demo: Sử dụng danh sách lớp chạy thử để tránh ảnh hưởng dữ liệu thật
      const classes = demoClasses || [
        { id: 9001, name: "Toán 7", short_name: "T7", rate_per_session: 150000, type: "FIXED", day_of_week: 2, start_time: "18:00", end_time: "20:00", valid_from: "2026-01-01", valid_to: null },
        { id: 9002, name: "Anh 8", short_name: "A8", rate_per_session: 180000, type: "FIXED", day_of_week: 3, start_time: "19:30", end_time: "21:30", valid_from: "2026-01-01", valid_to: null },
        { id: 9003, name: "Lý 11", short_name: "L11", rate_per_session: 200000, type: "FIXED", day_of_week: 5, start_time: "17:00", end_time: "19:00", valid_from: "2026-01-01", valid_to: null },
      ];

      const cancelledSessions = {};
      const extraIncomes = {};

      stats2026 = calculateSalaryStats(2026, classes.map((c: any) => ({
        class_id: c.id,
        name: c.name,
        short_name: c.short_name,
        rate_per_session: c.rate_per_session,
        type: c.type,
        day_of_week: c.day_of_week,
        start_time: c.start_time,
        end_time: c.end_time,
        valid_from: c.valid_from,
        valid_to: c.valid_to
      })), cancelledSessions, extraIncomes);

      dbContext = {
        classes,
        cancelledSessions,
        extraIncomes
      };
    } else {
      // Chế độ thực tế: Lấy dữ liệu thực từ database
      try {
        const schedules = await CalendarService.fetchCalendarData(userId);
        const supabase = await createClient();
        const { data: userData } = await supabase
          .from('users')
          .select('cancelled_sessions, extra_incomes')
          .eq('id', userId)
          .maybeSingle();

        const cancelledSessions = userData?.cancelled_sessions || {};
        const extraIncomes = userData?.extra_incomes || {};

        stats2026 = calculateSalaryStats(2026, schedules, cancelledSessions, extraIncomes);
        
        dbContext = {
          classes: schedules.map(s => ({
            id: s.class_id,
            name: s.name,
            short_name: s.short_name,
            rate_per_session: s.rate_per_session,
            type: s.type,
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
            valid_from: s.valid_from,
            valid_to: s.valid_to
          })),
          cancelledSessions,
          extraIncomes
        };
      } catch (dbErr) {
        console.error("Lỗi khi truy vấn DB làm ngữ cảnh AI:", dbErr);
      }
    }

    // 2. Thiết lập systemPrompt
    const systemPrompt = `Bạn là trợ lý ảo thông minh tên là Peanut AI của ứng dụng SPeanut, hỗ trợ người dùng quản lý lớp học và tính toán thù lao/lương dạy học của gia sư.
Hôm nay là ngày: ${todayStr} (Năm 2026).

Dưới đây là bảng thống kê tiền lương và buổi dạy của người dùng trong năm 2026 đã được hệ thống tính toán sẵn chính xác 100%:
${JSON.stringify(stats2026, null, 2)}

Dưới đây là chi tiết lịch dạy và các lớp học hiện có trong hệ thống:
${JSON.stringify(dbContext, null, 2)}

Nhiệm vụ của bạn là phân tích yêu cầu của người dùng bằng tiếng Việt và trả về một đối tượng JSON hợp lệ duy nhất có cấu trúc như sau:
{
  "type": "ANSWER" | "CREATE_CLASS" | "UPDATE_CLASS_SCHEDULE" | "UPDATE_CLASS_RATE" | "DELETE_CLASS" | "CANCEL_CLASS_SESSION" | "ADD_EXTRA_SESSION" | "CANCEL_AND_MAKEUP",
  "data": { ... xem chi tiết định dạng bên dưới ... },
  "message": "Câu trả lời thân thiện bằng tiếng Việt gửi tới người dùng giải thích việc bạn làm hoặc câu trả lời trực tiếp cho họ."
}

CHI TIẾT VỀ CÁC LOẠI PHẢN HỒI (type):

1. type = "ANSWER"
Dùng khi người dùng hỏi các câu hỏi chung, hỏi thông tin lương, số buổi dạy, buổi nghỉ của tháng bất kỳ (ví dụ: "Tháng 5 lương bao nhiêu", "Tháng 6 dạy mấy buổi").
- "data" chứa: { "text": "Câu trả lời chi tiết dạng văn bản viết bằng markdown" }
- Trong "message", hãy viết lại câu trả lời thật ngắn gọn.
- Chú ý: Bạn hãy lấy thông tin từ bảng thống kê tính sẵn ở trên để trả lời cực kỳ chính xác về số tiền lương, số buổi đã dạy, buổi nghỉ và thù lao chi tiết theo lớp. Ví dụ: Tháng 5 lương cơ bản là ..., thưởng thêm là ..., tổng thực nhận là ..., có ... buổi dạy và ... buổi nghỉ. Hãy trình bày rõ ràng, thân thiện.

2. type = "CREATE_CLASS"
Dùng khi người dùng mô tả một lớp học mới để tạo (hoặc muốn điều chỉnh nháp lớp học mới).
- "data" chứa:
  {
    "name": "Tên đầy đủ lớp học (Ví dụ: Toán 9 Cơ Bản 1)",
    "short_name": "Mã viết tắt dạng IN HOA viết liền không dấu (Ví dụ: T9CB1)",
    "rate_per_session": thù lao/buổi (số nguyên),
    "type": "FIXED" (cố định hàng tuần) hoặc "EXTRA" (học 1 buổi duy nhất),
    "selectedDays": mảng số nguyên các thứ trong tuần (0: CN, 1: T2, ..., 6: T7),
    "start_time": "Giờ bắt đầu dạng HH:MM (Mặc định 18:00)",
    "end_time": "Giờ kết thúc dạng HH:MM (Mặc định sau 2 tiếng)",
    "valid_from": "Ngày hiệu lực YYYY-MM-DD (Mặc định hôm nay ${todayStr})"
  }

3. type = "UPDATE_CLASS_SCHEDULE"
Dùng khi người dùng yêu cầu sửa lịch dạy, đổi thứ dạy hoặc đổi giờ dạy của một lớp học đang có trong hệ thống.
- "data" chứa:
  {
    "classId": số nguyên ID của lớp cần sửa (đối chiếu trong danh sách lớp hiện có),
    "className": "Tên lớp",
    "editSelectedDays": mảng số nguyên các thứ trong tuần mới,
    "editStartTime": "Giờ bắt đầu mới dạng HH:MM",
    "editEndTime": "Giờ kết thúc mới dạng HH:MM",
    "editValidFrom": "Ngày bắt đầu áp dụng lịch mới dạng YYYY-MM-DD"
  }

4. type = "UPDATE_CLASS_RATE"
Dùng khi người dùng yêu cầu thay đổi thù lao/đơn giá dạy học của một lớp học đang có trong hệ thống (Ví dụ: "sửa lương lớp Toán 9 thành 200k", "lớp toán 7 từ 10/6 lương 200k").
- "data" chứa:
  {
    "classId": số nguyên ID của lớp cần sửa,
    "className": "Tên lớp",
    "rate_per_session": thù lao mới (số nguyên),
    "effectiveDate": "Ngày bắt đầu áp dụng thù lao mới dạng YYYY-MM-DD (Ví dụ: 'từ 10/6' trong năm 2026 sẽ là '2026-06-10'). Chỉ cung cấp trường này nếu người dùng có chỉ định rõ ràng về mốc thời gian áp dụng mức lương mới. Nếu không chỉ định, hãy bỏ qua hoặc không đưa trường này vào."
  }

5. type = "DELETE_CLASS"
Dùng khi người dùng yêu cầu xóa một lớp học ra khỏi hệ thống (Ví dụ: "xóa lớp Toán 9", "bỏ lớp T10NC").
- "data" chứa:
  {
    "classId": số nguyên ID của lớp cần xóa,
    "className": "Tên lớp cần xóa"
  }

6. type = "CANCEL_CLASS_SESSION"
Dùng khi học sinh xin nghỉ một buổi học cụ thể hoặc khôi phục lịch dạy buổi học ngày hôm đó (Ví dụ: "Học sinh lớp Toán 9 hôm nay xin nghỉ nhé", "buổi hôm nay lớp toán 9 đi học lại bình thường").
- "data" chứa:
  {
    "classId": số nguyên ID của lớp học,
    "className": "Tên lớp học",
    "date": "Ngày nghỉ học/đi học lại dạng YYYY-MM-DD (nếu nói 'hôm nay' thì lấy ${todayStr})",
    "isCancelled": true (nếu là học sinh xin nghỉ dạy) hoặc false (nếu là khôi phục lịch học đi dạy bình thường)"
  }

7. type = "ADD_EXTRA_SESSION"
Dùng khi giáo viên xếp lịch dạy bù học hoặc một buổi học bổ trợ/thêm giờ ngoài lịch thường nhật (Ví dụ: "Lớp Lý 11 tuần này dạy bù vào Thứ 5 lúc 19h").
- "data" chứa:
  {
    "classId": số nguyên ID của lớp dạy bù,
    "className": "Tên lớp dạy bù",
    "date": "Ngày dạy bù học dạng YYYY-MM-DD (Ví dụ: 'Thứ 5 tuần này' tính từ ngày ${todayStr})",
    "start_time": "Giờ bắt đầu buổi dạy bù dạng HH:MM",
    "end_time": "Giờ kết thúc buổi dạy bù dạng HH:MM (mặc định sau 2 tiếng nếu không nói rõ)"
  }

8. type = "CANCEL_AND_MAKEUP"
Dùng khi người dùng yêu cầu nghỉ một buổi dạy và dạy bù sang một ngày khác (Ví dụ: "hôm nay nghỉ bù sang t7 đi", "cho lớp Toán 9 nghỉ thứ 3 tuần này rồi dạy bù vào thứ 7").
- Nếu người dùng nói "hôm nay nghỉ" hoặc "ngày X nghỉ" mà không nói rõ tên lớp, hãy tự tìm kiếm trong dbContext.classes xem lớp nào có lịch dạy thường nhật trùng với thứ trong tuần của ngày đó (ngày ${todayStr} là thứ mấy) để tự động chọn đúng lớp.
- "data" chứa:
  {
    "cancelSession": {
      "classId": số nguyên ID của lớp nghỉ,
      "className": "Tên lớp nghỉ",
      "date": "Ngày nghỉ học dạng YYYY-MM-DD (nếu nói 'hôm nay' thì lấy ${todayStr})",
      "isCancelled": true
    },
    "extraSession": {
      "classId": số nguyên ID của lớp dạy bù (trùng với ID lớp nghỉ),
      "className": "Tên lớp dạy bù (trùng với tên lớp nghỉ)",
      "date": "Ngày dạy bù học dạng YYYY-MM-DD (Ví dụ: Thứ 7 tiếp theo hoặc Thứ 7 tuần này tính từ ngày nghỉ ${todayStr})",
      "start_time": "Giờ dạy bù dạng HH:MM (lấy giờ học gốc của lớp đó hoặc theo yêu cầu)",
      "end_time": "Giờ kết thúc dạy bù dạng HH:MM (lấy giờ kết thúc gốc của lớp đó hoặc tính sau 2 tiếng từ giờ bắt đầu)"
    }
  }

* PHÁT HIỆN TRÙNG LỊCH (CONFLICT DETECTION):
Khi người dùng muốn tạo lịch (CREATE_CLASS), chỉnh sửa lịch học (UPDATE_CLASS_SCHEDULE) hoặc thêm buổi dạy bù (ADD_EXTRA_SESSION), bạn phải tự động đối chiếu các thứ trong tuần và khung giờ học dự kiến với danh sách lịch dạy hiện có của người dùng (trong dbContext.classes):
- Lịch học bị coi là trùng nếu ngày hiệu lực giao thoa nhau, thứ trong tuần trùng nhau và khung giờ học trùng hoặc giao nhau (ví dụ: lớp cũ học 18h-20h, lớp mới học 19h-21h).
- Nếu phát hiện trùng lịch, bạn PHẢI cảnh báo bằng câu bắt đầu bằng: "⚠️ Cảnh báo trùng lịch: Bạn đang có lớp [Tên lớp trùng] cũng dạy [Thứ trùng] từ [Giờ bắt đầu trùng] - [Giờ kết thúc trùng]. Bạn có chắc chắn muốn tiếp tục không?" và đặt cảnh báo này vào trường "message".
- Bạn vẫn trả về đúng cấu trúc "data" để nếu người dùng đồng ý, họ vẫn có thể bấm nút xác nhận.

* BÁO CÁO & PHÂN TÍCH TÀI CHÍNH (SALARY ANALYTICS):
Khi người dùng đặt câu hỏi phân tích, báo cáo hoặc xin lời khuyên tài chính:
- Hãy sử dụng bảng dữ liệu \`stats2026\` được tính toán sẵn cực kỳ chính xác để đưa ra câu trả lời thuyết phục, chi tiết, chuyên nghiệp.
- Nếu hỏi về tổn thất do nghỉ học: Dựa vào \`cancelledCount\` và mức thù lao lớp để báo cáo (Ví dụ: "Lớp Toán 9 học sinh nghỉ 3 buổi làm bạn hụt 600k thù lao dự kiến").
- Hãy đưa ra các lời khuyên tối ưu (Ví dụ: đề xuất tăng thù lao, ghép các lớp cùng cấp học lại thành nhóm để nhân thù lao/giờ làm việc).
- Trả về \`type: "ANSWER"\`, chi tiết markdown lưu trong \`data.text\` và tóm tắt ngắn gọn trong \`message\`.

CHÚ Ý: Chỉ trả về duy nhất chuỗi JSON hợp lệ, KHÔNG bao gồm markdown code blocks (\`\`\`json ... \`\`\`), KHÔNG có giải thích hay ký tự thừa nào khác.
`;

    // 3. Xây dựng prompt bổ sung nếu có nháp cũ để chỉnh sửa (chỉ áp dụng khi người dùng đang tạo dở lớp mới)
    let contextPrompt = "";
    if (currentPayload) {
      contextPrompt = `\n\nDƯỚI ĐÂY LÀ NHÁP LỚP HỌC MỚI ĐANG ĐƯỢC CHỜ XÁC NHẬN:\n${JSON.stringify(currentPayload, null, 2)}\n\nNếu người dùng yêu cầu điều chỉnh chi tiết lớp mới này, hãy giữ nguyên các trường khác và trả về JSON có type = "CREATE_CLASS".`;
    }

    let assistantMessage = "";

    // Ưu tiên sử dụng Google Gemini SDK nếu có cấu hình GEMINI_API_KEY
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here") {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Thử các model theo thứ tự ưu tiên (Gemini 2.5, 2.5 Lite, và 3.5 fallback) để tránh lỗi 404 hoặc 503
        const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3.5-flash"];
        let lastError = null;
        
        for (const modelName of modelsToTry) {
          try {
            console.log(`Đang thử gọi Google Gemini với model: ${modelName}`);
            const model = genAI.getGenerativeModel({
              model: modelName,
              generationConfig: {
                responseMimeType: "application/json",
              },
            });

            const prompt = `${systemPrompt}${contextPrompt}\n\nYêu cầu của người dùng:\n"${message}"`;
            const result = await model.generateContent(prompt);
            assistantMessage = result.response.text();
            
            if (assistantMessage) {
              console.log(`Gọi thành công model: ${modelName}`);
              break;
            }
          } catch (modelErr: any) {
            console.warn(`Thử model ${modelName} thất bại:`, modelErr.message || modelErr);
            lastError = modelErr;
          }
        }

        if (!assistantMessage && lastError) {
          throw lastError;
        }
      } catch (geminiError: any) {
        console.error("Lỗi khi gọi Google Gemini API:", geminiError);
        throw new Error(`Google Gemini API error: ${geminiError.message || geminiError}`);
      }
    } else {
      // Lấy 9Router URL và KEY từ env hoặc từ client header truyền lên làm fallback
      const ninerouterUrl = process.env.NINEROUTER_URL || request.headers.get("x-ninerouter-url");
      const ninerouterKey = process.env.NINEROUTER_KEY || request.headers.get("x-ninerouter-key");

      if (!ninerouterUrl) {
        return NextResponse.json({
          error: "GEMINI_API_KEY or NINEROUTER_URL is missing",
          message: "Chưa cấu hình GEMINI_API_KEY trong file .env hoặc cấu hình 9Router URL."
        }, { status: 400 });
      }

      const endpoint = `${ninerouterUrl.replace(/\/$/, "")}/v1/chat/completions`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (ninerouterKey) {
        headers["Authorization"] = `Bearer ${ninerouterKey}`;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt + contextPrompt },
            { role: "user", content: message }
          ],
          temperature: 0.1,
          stream: false
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`9Router API returned error: ${res.status} ${errorText}`);
      }

      const responseData = await res.json();
      assistantMessage = responseData.choices?.[0]?.message?.content || "";
    }

    // Làm sạch đầu ra đề phòng LLM tự ý thêm ```json ... ```
    let cleanJson = assistantMessage.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    try {
      const parsedData = JSON.parse(cleanJson);
      return NextResponse.json({ success: true, data: parsedData }, { status: 200 });
    } catch (parseError) {
      console.error("Lỗi parse JSON từ LLM:", assistantMessage, parseError);
      return NextResponse.json({
        error: "Lỗi giải mã thông tin lớp",
        message: "Trợ lý ảo trả về dữ liệu không hợp lệ. Vui lòng thử lại với câu mô tả chi tiết hơn.",
        raw: assistantMessage
      }, { status: 500 });
    }
  } catch (error: any) {
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error(`[AI Connect Error] ${error.code}: Failed to reach API endpoint.`);
    } else {
      console.error("Lỗi POST /api/ai/parse-class:", error);
    }
    
    let friendlyMessage = error.message || "Có lỗi xảy ra khi xử lý yêu cầu.";
    if (error.code === 'ENOTFOUND') {
      friendlyMessage = "Không thể tìm thấy địa chỉ máy chủ API (Lỗi DNS ENOTFOUND). Vui lòng kiểm tra kết nối mạng.";
    } else if (error.code === 'ECONNREFUSED') {
      friendlyMessage = "Kết nối tới máy chủ bị từ chối (Lỗi ECONNREFUSED). Hãy chắc chắn rằng máy chủ đang hoạt động.";
    }
    
    return NextResponse.json({ error: "Lỗi kết nối", message: friendlyMessage }, { status: 500 });
  }
}
