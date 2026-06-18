// app/components/AiAssistant.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Settings, Sparkles, 
  Calendar, Clock, DollarSign, Loader2, Check, Trash2 
} from 'lucide-react';
import styles from '../styles/AiAssistant.module.css';
import { fetchProfile, updateProfile } from '../services/profile';

interface AiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ClassPayload {
  name: string;
  short_name: string;
  rate_per_session: number;
  type: 'FIXED' | 'EXTRA';
  selectedDays: number[];
  start_time: string;
  end_time: string;
  valid_from: string;
}

interface UpdateSchedulePayload {
  classId: number;
  className: string;
  editSelectedDays: number[];
  editStartTime: string;
  editEndTime: string;
  editValidFrom: string;
}

interface UpdateRatePayload {
  classId: number;
  className: string;
  rate_per_session: number;
  effectiveDate?: string;
}

interface DeleteClassPayload {
  classId: number;
  className: string;
}

interface CancelSessionPayload {
  classId: number;
  className: string;
  date: string;
  isCancelled: boolean;
}

interface AddExtraSessionPayload {
  classId: number;
  className: string;
  date: string;
  start_time: string;
  end_time: string;
}

interface CancelAndMakeupPayload {
  cancelSession: CancelSessionPayload;
  extraSession: AddExtraSessionPayload;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  payload?: ClassPayload;
  updateSchedulePayload?: UpdateSchedulePayload;
  updateRatePayload?: UpdateRatePayload;
  deleteClassPayload?: DeleteClassPayload;
  cancelSessionPayload?: CancelSessionPayload;
  addExtraSessionPayload?: AddExtraSessionPayload;
  cancelAndMakeupPayload?: CancelAndMakeupPayload;
  error?: boolean;
}

interface AIResponse {
  type: 'ANSWER' | 'CREATE_CLASS' | 'UPDATE_CLASS_SCHEDULE' | 'UPDATE_CLASS_RATE' | 'DELETE_CLASS' | 'CANCEL_CLASS_SESSION' | 'ADD_EXTRA_SESSION' | 'CANCEL_AND_MAKEUP';
  data: any;
  message: string;
}

const DAYS_LABELS = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

const DEFAULT_DEMO_CLASSES = [
  { id: 9001, name: "Toán 7", short_name: "T7", rate_per_session: 150000, type: "FIXED", selectedDays: [2], start_time: "18:00", end_time: "20:00", valid_from: "2026-01-01", valid_to: null },
  { id: 9002, name: "Anh 8", short_name: "A8", rate_per_session: 180000, type: "FIXED", selectedDays: [3], start_time: "19:30", end_time: "21:30", valid_from: "2026-01-01", valid_to: null },
  { id: 9003, name: "Lý 11", short_name: "L11", rate_per_session: 200000, type: "FIXED", selectedDays: [5], start_time: "17:00", end_time: "19:00", valid_from: "2026-01-01", valid_to: null },
];

export default function AiAssistant({ isOpen, onClose }: AiAssistantProps) {
  const [showSettings, setShowSettings] = useState(false);

  // Settings State
  const [ninerouterUrl, setNinerouterUrl] = useState('');
  const [ninerouterKey, setNinerouterKey] = useState('');

  // Interactive Demo State
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoClasses, setDemoClasses] = useState<any[]>([]);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load Settings on Mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUrl = localStorage.getItem('speanut_ninerouter_url') || 'https://9router.decolua.com';
      const savedKey = localStorage.getItem('speanut_ninerouter_key') || '';
      setNinerouterUrl(savedUrl);
      setNinerouterKey(savedKey);
      
      // Khởi tạo tin nhắn chào mừng
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: 'Xin chào! Tôi là Trợ lý Peanut AI. Bạn có thể trò chuyện với tôi để quản lý lịch dạy, đổi thù lao, báo nghỉ học và tính lương tự động.\n\n💡 Bạn muốn thử nghiệm mọi tính năng trợ lý ảo (tạo lớp, báo nghỉ bù, tính lương...) mà không ảnh hưởng đến dữ liệu thật?'
        }
      ]);
    }
  }, []);

  // Lắng nghe xem AI có mở trong chế độ Tour không để kích hoạt chạy thử
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && localStorage.getItem('speanut_tour_mode') === 'true') {
      setIsDemoMode(true);
      setDemoClasses(DEFAULT_DEMO_CLASSES);
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: 'Xin chào! Tôi là Trợ lý Peanut AI. Bạn có thể trò chuyện với tôi để quản lý lịch dạy, đổi thù lao, báo nghỉ học và tính lương tự động.\n\n💡 Bạn muốn thử nghiệm mọi tính năng trợ lý ảo (tạo lớp, báo nghỉ bù, tính lương...) mà không ảnh hưởng đến dữ liệu thật?'
        },
        {
          id: 'demo-welcome',
          sender: 'assistant',
          text: '🎮 **Đã bật Chế độ Chạy thử Tương tác (Demo)!**\n\nMọi thay đổi lịch học và lương ở chế độ này chỉ mang tính mô phỏng trên trình duyệt, không ảnh hưởng đến dữ liệu thực của bạn.\n\n👉 Bạn hãy bấm thử vào các gợi ý bên dưới hoặc tự gõ câu mô tả để trải nghiệm trợ lý nhé!'
        }
      ]);
      window.dispatchEvent(new CustomEvent('speanut_tour_event', { detail: { type: 'ai_demo_started' } }));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('speanut_tour_event', { detail: { type: 'ai_opened' } }));
    }
  }, [isOpen]);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  if (!isOpen) return null;

  // Save settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('speanut_ninerouter_url', ninerouterUrl);
    localStorage.setItem('speanut_ninerouter_key', ninerouterKey);
    setShowSettings(false);
  };

  const handleStartDemoMode = () => {
    setIsDemoMode(true);
    setDemoClasses(DEFAULT_DEMO_CLASSES);
    setMessages(prev => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'assistant',
        text: '🎮 **Đã bật Chế độ Chạy thử Tương tác (Demo)!**\n\nMọi thay đổi lịch học và lương ở chế độ này chỉ mang tính mô phỏng trên trình duyệt, không ảnh hưởng đến dữ liệu thực của bạn.\n\n👉 Bạn hãy bấm thử vào các gợi ý bên dưới hoặc tự gõ câu mô tả để trải nghiệm trợ lý nhé!'
      }
    ]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('speanut_tour_event', { detail: { type: 'ai_demo_started' } }));
    }
  };

  const handleExitDemoMode = () => {
    setIsDemoMode(false);
    setDemoClasses([]);
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: 'Xin chào! Tôi là Trợ lý Peanut AI. Bạn có thể trò chuyện với tôi để quản lý lịch dạy, đổi thù lao, báo nghỉ học và tính lương tự động.\n\n💡 Bạn muốn thử nghiệm mọi tính năng trợ lý ảo (tạo lớp, báo nghỉ bù, tính lương...) mà không ảnh hưởng đến dữ liệu thật?'
      }
    ]);
  };

  // Common Parse Logic
  const parseMessage = async (messageText: string, currentPayload?: ClassPayload): Promise<AIResponse> => {
    const res = await fetch('/api/ai/parse-class', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ninerouter-url': ninerouterUrl,
        'x-ninerouter-key': ninerouterKey,
      },
      body: JSON.stringify({ 
        message: messageText, 
        currentPayload,
        isDemoMode,
        demoClasses: isDemoMode ? demoClasses : undefined
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Lỗi xử lý ngôn ngữ.');
    }
    return data.data as AIResponse;
  };

  // Chat Submission
  const handleSendChat = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userText = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { id: String(Date.now()), sender: 'user', text: userText }]);
    setIsProcessing(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('speanut_tour_event', { detail: { type: 'ai_message_sent' } }));
    }

    try {
      const lastPayload = [...messages].reverse().find(m => m.payload)?.payload;
      const parsed = await parseMessage(userText, lastPayload);
      const { type, data, message } = parsed;

      const newMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: message || 'Đã xử lý yêu cầu.'
      };

      if (type === 'CREATE_CLASS') {
        newMsg.payload = data;
      } else if (type === 'UPDATE_CLASS_SCHEDULE') {
        newMsg.updateSchedulePayload = data;
      } else if (type === 'UPDATE_CLASS_RATE') {
        newMsg.updateRatePayload = data;
      } else if (type === 'DELETE_CLASS') {
        newMsg.deleteClassPayload = data;
      } else if (type === 'CANCEL_CLASS_SESSION') {
        newMsg.cancelSessionPayload = data;
      } else if (type === 'ADD_EXTRA_SESSION') {
        newMsg.addExtraSessionPayload = data;
      } else if (type === 'CANCEL_AND_MAKEUP') {
        newMsg.cancelAndMakeupPayload = data;
      } else if (type === 'ANSWER') {
        newMsg.text = data.text;
      }

      setMessages(prev => [...prev, newMsg]);
      // CHAT MODE: KHÔNG gọi speakText để đọc to câu trả lời!
    } catch (err: any) {
      // Chỉ hiện message thân thiện, không dump lỗi kỹ thuật
      const errText = err.message || 'Trợ lý AI gặp sự cố. Vui lòng thử lại sau.';
      // Bỏ prefix kỹ thuật nếu có (ví dụ: "Error: ...")
      const cleanMsg = errText.replace(/^(Error|Lỗi):\s*/i, '').trim();
      setMessages(prev => [...prev, {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: `⚠️ ${cleanMsg}`,
        error: true
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Final class database creation
  const handleConfirmCreate = async (payload: ClassPayload) => {
    setIsProcessing(true);
    if (isDemoMode) {
      setTimeout(() => {
        const newId = Date.now();
        const newClass = {
          id: newId,
          name: payload.name,
          short_name: payload.short_name,
          rate_per_session: payload.rate_per_session,
          type: payload.type,
          selectedDays: payload.selectedDays,
          start_time: payload.start_time,
          end_time: payload.end_time,
          valid_from: payload.valid_from,
          valid_to: null
        };
        setDemoClasses(prev => [...prev, newClass]);
        setMessages(prev => [...prev, {
          id: String(Date.now() + 2),
          sender: 'assistant',
          text: `🎉 **[Chạy thử]** Lớp học "${payload.name}" (${payload.short_name}) đã được tạo giả lập thành công vào hệ thống chạy thử!\n- Giờ học: ${payload.start_time} - ${payload.end_time}\n- Thù lao: ${payload.rate_per_session.toLocaleString()}đ\n*(Dữ liệu này được lưu tạm thời, không thay đổi lịch học thực tế).*`
        }]);
        setIsProcessing(false);
      }, 800);
      return;
    }

    try {
      const res = await fetch('/api/class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể tạo lớp học.');

      setMessages(prev => [...prev, {
        id: String(Date.now() + 2),
        sender: 'assistant',
        text: `🎉 Tuyệt vời! Lớp học "${payload.name}" (${payload.short_name}) đã được tạo thành công vào hệ thống. Đang đồng bộ lại lịch làm việc...`
      }]);

      setTimeout(() => { window.location.reload(); }, 1500);
    } catch (err: any) {
      alert(`Lỗi tạo lớp học: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Final schedule update
  const handleConfirmUpdateSchedule = async (payload: UpdateSchedulePayload) => {
    setIsProcessing(true);
    if (isDemoMode) {
      setTimeout(() => {
        setDemoClasses(prev => prev.map(c => {
          if (c.id === payload.classId) {
            return {
              ...c,
              selectedDays: payload.editSelectedDays,
              start_time: payload.editStartTime,
              end_time: payload.editEndTime,
              valid_from: payload.editValidFrom
            };
          }
          return c;
        }));
        setMessages(prev => [...prev, {
          id: String(Date.now() + 2),
          sender: 'assistant',
          text: `🎉 **[Chạy thử]** Đã cập nhật lịch dạy lớp "${payload.className}" thành công sang giờ học mới: ${payload.editStartTime} - ${payload.editEndTime}.`
        }]);
        setIsProcessing(false);
      }, 800);
      return;
    }

    try {
      const res = await fetch('/api/class', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể cập nhật lịch.');

      const successText = `🎉 Lịch dạy của lớp "${payload.className}" đã được cập nhật thành công!`;
      setMessages(prev => [...prev, {
        id: String(Date.now() + 2),
        sender: 'assistant',
        text: successText
      }]);

      setTimeout(() => { window.location.reload(); }, 1500);
    } catch (err: any) {
      alert(`Lỗi cập nhật lịch: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Final rate update
  const handleConfirmUpdateRate = async (payload: UpdateRatePayload) => {
    setIsProcessing(true);
    if (isDemoMode) {
      setTimeout(() => {
        setDemoClasses(prev => prev.map(c => {
          if (c.id === payload.classId) {
            return {
              ...c,
              rate_per_session: payload.rate_per_session
            };
          }
          return c;
        }));
        const labelText = payload.effectiveDate ? ` từ ngày ${payload.effectiveDate.split('-').reverse().join('/')}` : '';
        setMessages(prev => [...prev, {
          id: String(Date.now() + 2),
          sender: 'assistant',
          text: `🎉 **[Chạy thử]** Đã đổi thù lao lớp "${payload.className}" thành ${payload.rate_per_session.toLocaleString()}đ / buổi${labelText} thành công.`
        }]);
        setIsProcessing(false);
      }, 800);
      return;
    }

    try {
      const res = await fetch('/api/class', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: payload.classId,
          rate_per_session: payload.rate_per_session,
          effectiveDate: payload.effectiveDate
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể đổi thù lao.');

      const labelText = payload.effectiveDate 
        ? ` từ ngày ${payload.effectiveDate.split('-').reverse().join('/')}`
        : '';
      const successText = `🎉 Thù lao lớp "${payload.className}" đã được đổi thành ${payload.rate_per_session.toLocaleString()}đ / buổi${labelText} thành công!`;
      setMessages(prev => [...prev, {
        id: String(Date.now() + 2),
        sender: 'assistant',
        text: successText
      }]);

      setTimeout(() => { window.location.reload(); }, 1500);
    } catch (err: any) {
      alert(`Lỗi đổi thù lao: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Final deletion
  const handleConfirmDeleteClass = async (payload: DeleteClassPayload) => {
    setIsProcessing(true);
    if (isDemoMode) {
      setTimeout(() => {
        setDemoClasses(prev => prev.filter(c => c.id !== payload.classId));
        setMessages(prev => [...prev, {
          id: String(Date.now() + 2),
          sender: 'assistant',
          text: `🎉 **[Chạy thử]** Đã xóa lớp học "${payload.className}" khỏi hệ thống chạy thử thành công.`
        }]);
        setIsProcessing(false);
      }, 800);
      return;
    }

    try {
      const res = await fetch(`/api/class?id=${payload.classId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể xóa lớp học.');

      const successText = `🎉 Đã xóa hoàn toàn lớp học "${payload.className}" khỏi hệ thống thành công!`;
      setMessages(prev => [...prev, {
        id: String(Date.now() + 2),
        sender: 'assistant',
        text: successText
      }]);

      setTimeout(() => { window.location.reload(); }, 1500);
    } catch (err: any) {
      alert(`Lỗi xóa lớp học: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Final cancel session update
  const handleConfirmCancelSession = async (payload: CancelSessionPayload) => {
    setIsProcessing(true);
    if (isDemoMode) {
      setTimeout(() => {
        const successText = payload.isCancelled
          ? `🎉 **[Chạy thử]** Đã ghi nhận nghỉ dạy lớp "${payload.className}" ngày ${payload.date.split('-').reverse().join('/')} thành công!`
          : `🎉 **[Chạy thử]** Đã ghi nhận đi dạy lại lớp "${payload.className}" ngày ${payload.date.split('-').reverse().join('/')} thành công!`;
        setMessages(prev => [...prev, {
          id: String(Date.now() + 2),
          sender: 'assistant',
          text: successText
        }]);
        setIsProcessing(false);
      }, 800);
      return;
    }

    try {
      // 1. Tải profile hiện tại để lấy danh sách buổi nghỉ cũ
      const profile = await fetchProfile();
      const cancelledSessions = { ...(profile.cancelled_sessions || {}) };
      
      // 2. Cập nhật key hủy buổi
      const cancelKey = `${payload.classId}_${payload.date}`;
      if (payload.isCancelled) {
        cancelledSessions[cancelKey] = true;
      } else {
        delete cancelledSessions[cancelKey];
      }

      // 3. Gửi cập nhật lên server
      await updateProfile({ cancelled_sessions: cancelledSessions });

      const successText = payload.isCancelled
        ? `🎉 Đã ghi nhận nghỉ dạy lớp "${payload.className}" ngày ${payload.date.split('-').reverse().join('/')} thành công!`
        : `🎉 Đã ghi nhận đi dạy lại lớp "${payload.className}" ngày ${payload.date.split('-').reverse().join('/')} thành công!`;
      
      setMessages(prev => [...prev, {
        id: String(Date.now() + 2),
        sender: 'assistant',
        text: successText
      }]);

      setTimeout(() => { window.location.reload(); }, 1500);
    } catch (err: any) {
      alert(`Lỗi ghi nhận buổi nghỉ: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Final add extra session update
  const handleConfirmAddExtraSession = async (payload: AddExtraSessionPayload) => {
    setIsProcessing(true);
    if (isDemoMode) {
      setTimeout(() => {
        const newId = Date.now();
        const newExtra = {
          id: newId,
          name: payload.className,
          short_name: "EXTRA",
          rate_per_session: 150000,
          type: "EXTRA",
          selectedDays: [],
          start_time: payload.start_time,
          end_time: payload.end_time,
          valid_from: payload.date,
          valid_to: payload.date
        };
        setDemoClasses(prev => [...prev, newExtra]);
        setMessages(prev => [...prev, {
          id: String(Date.now() + 2),
          sender: 'assistant',
          text: `🎉 **[Chạy thử]** Đã xếp lịch dạy bù lớp "${payload.className}" vào ngày ${payload.date.split('-').reverse().join('/')} từ ${payload.start_time} thành công!`
        }]);
        setIsProcessing(false);
      }, 800);
      return;
    }

    try {
      const res = await fetch('/api/class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-session',
          classId: payload.classId,
          date: payload.date,
          start_time: payload.start_time,
          end_time: payload.end_time
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể tạo buổi dạy bù.');

      const successText = `🎉 Đã xếp lịch dạy bù lớp "${payload.className}" vào ngày ${payload.date.split('-').reverse().join('/')} từ ${payload.start_time} thành công!`;
      setMessages(prev => [...prev, {
        id: String(Date.now() + 2),
        sender: 'assistant',
        text: successText
      }]);

      setTimeout(() => { window.location.reload(); }, 1500);
    } catch (err: any) {
      alert(`Lỗi ghi nhận buổi dạy bù: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Final cancel and makeup session update
  const handleConfirmCancelAndMakeup = async (payload: CancelAndMakeupPayload) => {
    setIsProcessing(true);
    if (isDemoMode) {
      setTimeout(() => {
        const newId = Date.now();
        const newExtra = {
          id: newId,
          name: payload.extraSession.className,
          short_name: "EXTRA",
          rate_per_session: 150000,
          type: "EXTRA",
          selectedDays: [],
          start_time: payload.extraSession.start_time,
          end_time: payload.extraSession.end_time,
          valid_from: payload.extraSession.date,
          valid_to: payload.extraSession.date
        };
        setDemoClasses(prev => [...prev, newExtra]);
        setMessages(prev => [...prev, {
          id: String(Date.now() + 2),
          sender: 'assistant',
          text: `🎉 **[Chạy thử]** Đã ghi nhận nghỉ dạy lớp "${payload.cancelSession.className}" ngày ${payload.cancelSession.date.split('-').reverse().join('/')} và xếp lịch dạy bù vào ngày ${payload.extraSession.date.split('-').reverse().join('/')} từ ${payload.extraSession.start_time} thành công!`
        }]);
        setIsProcessing(false);
      }, 800);
      return;
    }

    try {
      // 1. Ghi nhận nghỉ buổi học
      const profile = await fetchProfile();
      const cancelledSessions = { ...(profile.cancelled_sessions || {}) };
      const cancelKey = `${payload.cancelSession.classId}_${payload.cancelSession.date}`;
      if (payload.cancelSession.isCancelled) {
        cancelledSessions[cancelKey] = true;
      } else {
        delete cancelledSessions[cancelKey];
      }
      await updateProfile({ cancelled_sessions: cancelledSessions });

      // 2. Thêm buổi dạy bù
      const res = await fetch('/api/class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-session',
          classId: payload.extraSession.classId,
          date: payload.extraSession.date,
          start_time: payload.extraSession.start_time,
          end_time: payload.extraSession.end_time
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể tạo buổi dạy bù.');

      const successText = `🎉 Đã ghi nhận nghỉ dạy lớp "${payload.cancelSession.className}" ngày ${payload.cancelSession.date.split('-').reverse().join('/')} và xếp lịch dạy bù vào ngày ${payload.extraSession.date.split('-').reverse().join('/')} từ ${payload.extraSession.start_time} thành công!`;
      
      setMessages(prev => [...prev, {
        id: String(Date.now() + 2),
        sender: 'assistant',
        text: successText
      }]);

      setTimeout(() => { window.location.reload(); }, 1500);
    } catch (err: any) {
      alert(`Lỗi ghi nhận nghỉ bù: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>
            <Sparkles size={20} style={{ color: 'var(--primary)' }} />
            <span>Trợ lý Peanut AI</span>
          </h2>
          <div className={styles.headerActions}>
            <button 
              type="button" 
              className={styles.iconBtn} 
              onClick={() => setShowSettings(!showSettings)}
              title="Cài đặt kết nối 9Router"
            >
              <Settings size={18} />
            </button>
            <button type="button" className={styles.closeBtn} onClick={onClose} title="Đóng">
              <X size={18} />
            </button>
          </div>
        </div>
        {isDemoMode && (
          <div style={{
            backgroundColor: 'rgba(255, 176, 0, 0.08)',
            borderBottom: '1px solid rgba(255, 176, 0, 0.15)',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '13px',
            color: '#FFB000',
            fontWeight: 600,
            gap: '8px'
          }}>
            <span>🎮 Bạn đang ở Chế độ Chạy thử (Demo)</span>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: '#FFB000',
                textDecoration: 'underline',
                cursor: 'pointer',
                marginLeft: 'auto',
                fontWeight: 700,
                fontSize: '12px'
              }}
              onClick={handleExitDemoMode}
            >
              Thoát Demo
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className={styles.content}>
          {showSettings ? (
            /* CONFIG SCREEN */
            <form onSubmit={handleSaveSettings} className={styles.settingsForm}>
              <h3 className={styles.settingsTitle}>Cấu hình kết nối 9Router</h3>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>9Router API URL</label>
                <input 
                  type="url" 
                  className={styles.formInput}
                  placeholder="Ví dụ: https://9router.decolua.com"
                  value={ninerouterUrl}
                  onChange={(e) => setNinerouterUrl(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>9Router Authorization Key (Nếu có)</label>
                <input 
                  type="password" 
                  className={styles.formInput}
                  placeholder="Nhập API Key hoặc token..."
                  value={ninerouterKey}
                  onChange={(e) => setNinerouterKey(e.target.value)}
                />
              </div>
              <p className={styles.settingsNotice}>
                Thông tin kết nối sẽ được lưu cục bộ trên trình duyệt của bạn (localStorage) và được truyền bảo mật qua headers.
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className={styles.confirmBtn} style={{ margin: 0 }}>
                  Lưu cấu hình
                </button>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowSettings(false)}>
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            /* CHAT INTERFACE */
            <>
              <div className={styles.chatMessages}>
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`${styles.messageRow} ${msg.sender === 'user' ? styles.userRow : styles.assistantRow}`}
                  >
                    <div className={`${styles.messageBubble} ${msg.sender === 'user' ? styles.userBubble : styles.assistantBubble}`}>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>

                      {msg.id === 'welcome' && !isDemoMode && (
                        <div style={{ marginTop: '12px' }}>
                          <button
                            type="button"
                            id="tour-ai-demo-btn"
                            style={{
                              backgroundColor: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              padding: '8px 14px',
                              borderRadius: '10px',
                              fontWeight: 700,
                              fontSize: '12.5px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'transform 0.2s ease',
                              boxShadow: '0 4px 10px rgba(115, 91, 242, 0.2)'
                            }}
                            onClick={handleStartDemoMode}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            🚀 Bắt đầu Chạy thử Tương tác (Demo)
                          </button>
                        </div>
                      )}

                      {/* Display payload confirmation card if assistant attached one */}
                      {msg.payload && (
                        <div className={styles.previewCard} onClick={(e) => e.stopPropagation()}>
                          {msg.text.includes('⚠️') && (
                            <div style={{ 
                              backgroundColor: 'rgba(235, 87, 87, 0.08)', 
                              borderLeft: '4px solid #eb5757', 
                              padding: '10px 12px', 
                              borderRadius: '8px',
                              color: '#eb5757',
                              fontSize: '12.5px',
                              lineHeight: '1.4',
                              fontWeight: 600,
                              marginBottom: '10px'
                            }}>
                              {msg.text}
                            </div>
                          )}
                          <div className={styles.previewHeader}>
                            <span className={`${styles.previewBadge} ${msg.payload.type === 'FIXED' ? styles.badgeFixed : styles.badgeExtra}`}>
                              {msg.payload.type === 'FIXED' ? 'Cố định' : 'Bổ trợ (Extra)'}
                            </span>
                            <span className={styles.previewRate}>
                              {msg.payload.rate_per_session.toLocaleString()}đ / buổi
                            </span>
                          </div>
                          
                          <h4 className={styles.previewTitle}>
                            {msg.payload.name} ({msg.payload.short_name})
                          </h4>

                          <div className={styles.previewMeta}>
                            <div className={styles.metaItem}>
                              <Clock size={14} className={styles.metaIcon} />
                              <span>Giờ học: {msg.payload.start_time} - {msg.payload.end_time}</span>
                            </div>
                            <div className={styles.metaItem}>
                              <Calendar size={14} className={styles.metaIcon} />
                              <span>
                                {msg.payload.type === 'FIXED' 
                                  ? `Lịch: ${msg.payload.selectedDays.map(d => DAYS_LABELS[d]).join(', ')}` 
                                  : `Ngày dạy: ${msg.payload.valid_from.split('-').reverse().join('/')}`
                                }
                              </span>
                            </div>
                            {msg.payload.type === 'FIXED' && (
                              <div className={styles.metaItem}>
                                <Calendar size={14} className={styles.metaIcon} />
                                <span>Áp dụng từ: {msg.payload.valid_from.split('-').reverse().join('/')}</span>
                              </div>
                            )}
                          </div>

                          <div className={styles.previewActions}>
                            <button 
                              type="button" 
                              className={styles.confirmBtn}
                              onClick={() => handleConfirmCreate(msg.payload!)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              Xác nhận tạo
                            </button>
                            <button 
                              type="button" 
                              className={styles.cancelBtn}
                              onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
                              disabled={isProcessing}
                            >
                              Hủy bỏ
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Thẻ xác nhận cập nhật lịch dạy */}
                      {msg.updateSchedulePayload && (
                        <div className={styles.previewCard} onClick={(e) => e.stopPropagation()}>
                          {msg.text.includes('⚠️') && (
                            <div style={{ 
                              backgroundColor: 'rgba(235, 87, 87, 0.08)', 
                              borderLeft: '4px solid #eb5757', 
                              padding: '10px 12px', 
                              borderRadius: '8px',
                              color: '#eb5757',
                              fontSize: '12.5px',
                              lineHeight: '1.4',
                              fontWeight: 600,
                              marginBottom: '10px'
                            }}>
                              {msg.text}
                            </div>
                          )}
                          <div className={styles.previewHeader}>
                            <span className={styles.badgeSchedule}>Đổi lịch dạy</span>
                          </div>
                          <h4 className={styles.previewTitle}>
                            {msg.updateSchedulePayload.className}
                          </h4>
                          <div className={styles.previewMeta}>
                            <div className={styles.metaItem}>
                              <Clock size={14} className={styles.metaIcon} />
                              <span>Giờ học mới: {msg.updateSchedulePayload.editStartTime} - {msg.updateSchedulePayload.editEndTime}</span>
                            </div>
                            <div className={styles.metaItem}>
                              <Calendar size={14} className={styles.metaIcon} />
                              <span>Thứ mới: {msg.updateSchedulePayload.editSelectedDays.map(d => DAYS_LABELS[d]).join(', ')}</span>
                            </div>
                            <div className={styles.metaItem}>
                              <Calendar size={14} className={styles.metaIcon} />
                              <span>Áp dụng từ: {msg.updateSchedulePayload.editValidFrom.split('-').reverse().join('/')}</span>
                            </div>
                          </div>
                          <div className={styles.previewActions}>
                            <button 
                              type="button" 
                              className={styles.confirmBtn}
                              onClick={() => handleConfirmUpdateSchedule(msg.updateSchedulePayload!)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              Xác nhận cập nhật
                            </button>
                            <button 
                              type="button" 
                              className={styles.cancelBtn}
                              onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
                              disabled={isProcessing}
                            >
                              Hủy bỏ
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Thẻ xác nhận đổi thù lao */}
                      {msg.updateRatePayload && (
                        <div className={styles.previewCard} onClick={(e) => e.stopPropagation()}>
                          <div className={styles.previewHeader}>
                            <span className={styles.badgeRate}>Đổi thù lao</span>
                          </div>
                          <h4 className={styles.previewTitle}>
                            Lớp: {msg.updateRatePayload.className}
                          </h4>
                          <div className={styles.previewMeta}>
                            <div className={styles.metaItem}>
                              <DollarSign size={14} className={styles.metaIcon} />
                              <span>Mức lương mới: <strong>{msg.updateRatePayload.rate_per_session.toLocaleString()}đ</strong> / buổi</span>
                            </div>
                            {msg.updateRatePayload.effectiveDate && (
                              <div className={styles.metaItem}>
                                <Calendar size={14} className={styles.metaIcon} />
                                <span>Áp dụng từ: {msg.updateRatePayload.effectiveDate.split('-').reverse().join('/')}</span>
                              </div>
                            )}
                          </div>
                          <div className={styles.previewActions}>
                            <button 
                              type="button" 
                              className={styles.confirmBtn}
                              onClick={() => handleConfirmUpdateRate(msg.updateRatePayload!)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              Xác nhận thay đổi
                            </button>
                            <button 
                              type="button" 
                              className={styles.cancelBtn}
                              onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
                              disabled={isProcessing}
                            >
                              Hủy bỏ
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Thẻ xác nhận xóa lớp học */}
                      {msg.deleteClassPayload && (
                        <div className={styles.previewCard} onClick={(e) => e.stopPropagation()}>
                          <div className={styles.previewHeader}>
                            <span className={styles.badgeDelete}>Xóa lớp học</span>
                          </div>
                          <h4 className={styles.previewTitle} style={{ color: '#eb5757' }}>
                            Bạn chắc chắn muốn xóa lớp?
                          </h4>
                          <div className={styles.previewMeta}>
                            <p>Lớp học: <strong>{msg.deleteClassPayload.className}</strong></p>
                            <p style={{ fontSize: '11px', color: '#eb5757', marginTop: '5px' }}>
                              ⚠️ Thao tác này sẽ xóa vĩnh viễn thông tin lớp học và các lịch liên quan.
                            </p>
                          </div>
                          <div className={styles.previewActions}>
                            <button 
                              type="button" 
                              className={styles.confirmBtn}
                              style={{ backgroundColor: '#eb5757', color: 'white' }}
                              onClick={() => handleConfirmDeleteClass(msg.deleteClassPayload!)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                              Xác nhận xóa
                            </button>
                            <button 
                              type="button" 
                              className={styles.cancelBtn}
                              onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
                              disabled={isProcessing}
                            >
                              Hủy bỏ
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Thẻ xác nhận nghỉ học/đi học lại */}
                      {msg.cancelSessionPayload && (
                        <div className={styles.previewCard} onClick={(e) => e.stopPropagation()}>
                          <div className={styles.previewHeader}>
                            <span className={msg.cancelSessionPayload.isCancelled ? styles.badgeDelete : styles.badgeSchedule}>
                              {msg.cancelSessionPayload.isCancelled ? 'Hủy buổi học' : 'Dạy lại bình thường'}
                            </span>
                          </div>
                          <h4 className={styles.previewTitle}>
                            Lớp: {msg.cancelSessionPayload.className}
                          </h4>
                          <div className={styles.previewMeta}>
                            <div className={styles.metaItem}>
                              <Calendar size={14} className={styles.metaIcon} />
                              <span>Ngày: {msg.cancelSessionPayload.date.split('-').reverse().join('/')}</span>
                            </div>
                            <div className={styles.metaItem}>
                              <Clock size={14} className={styles.metaIcon} />
                              <span>Trạng thái: <strong>{msg.cancelSessionPayload.isCancelled ? 'Nghỉ dạy (Trừ lương)' : 'Đi học lại (Tính lương)'}</strong></span>
                            </div>
                          </div>
                          <div className={styles.previewActions}>
                            <button 
                              type="button" 
                              className={styles.confirmBtn}
                              style={msg.cancelSessionPayload.isCancelled ? { backgroundColor: '#eb5757', color: 'white' } : undefined}
                              onClick={() => handleConfirmCancelSession(msg.cancelSessionPayload!)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              Xác nhận {msg.cancelSessionPayload.isCancelled ? 'Nghỉ học' : 'Học lại'}
                            </button>
                            <button 
                              type="button" 
                              className={styles.cancelBtn}
                              onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
                              disabled={isProcessing}
                            >
                              Hủy bỏ
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Thẻ xác nhận xếp lịch dạy bù/bổ trợ */}
                      {msg.addExtraSessionPayload && (
                        <div className={styles.previewCard} onClick={(e) => e.stopPropagation()}>
                          {msg.text.includes('⚠️') && (
                            <div style={{ 
                              backgroundColor: 'rgba(235, 87, 87, 0.08)', 
                              borderLeft: '4px solid #eb5757', 
                              padding: '10px 12px', 
                              borderRadius: '8px',
                              color: '#eb5757',
                              fontSize: '12.5px',
                              lineHeight: '1.4',
                              fontWeight: 600,
                              marginBottom: '10px'
                            }}>
                              {msg.text}
                            </div>
                          )}
                          <div className={styles.previewHeader}>
                            <span className={styles.badgeExtra}>
                              Dạy bù / Bổ trợ
                            </span>
                          </div>
                          <h4 className={styles.previewTitle}>
                            Lớp: {msg.addExtraSessionPayload.className}
                          </h4>
                          <div className={styles.previewMeta}>
                            <div className={styles.metaItem}>
                              <Calendar size={14} className={styles.metaIcon} />
                              <span>Ngày dạy: {msg.addExtraSessionPayload.date.split('-').reverse().join('/')}</span>
                            </div>
                            <div className={styles.metaItem}>
                              <Clock size={14} className={styles.metaIcon} />
                              <span>Giờ học: {msg.addExtraSessionPayload.start_time} - {msg.addExtraSessionPayload.end_time}</span>
                            </div>
                          </div>
                          <div className={styles.previewActions}>
                            <button 
                              type="button" 
                              className={styles.confirmBtn}
                              style={{ backgroundColor: '#FFB000', color: 'white' }}
                              onClick={() => handleConfirmAddExtraSession(msg.addExtraSessionPayload!)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              Xác nhận dạy bù
                            </button>
                            <button 
                              type="button" 
                              className={styles.cancelBtn}
                              onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
                              disabled={isProcessing}
                            >
                              Hủy bỏ
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Thẻ xác nhận nghỉ dạy và dạy bù (Nghỉ bù) */}
                      {msg.cancelAndMakeupPayload && (
                        <div className={styles.previewCard} onClick={(e) => e.stopPropagation()}>
                          {msg.text.includes('⚠️') && (
                            <div style={{ 
                              backgroundColor: 'rgba(235, 87, 87, 0.08)', 
                              borderLeft: '4px solid #eb5757', 
                              padding: '10px 12px', 
                              borderRadius: '8px',
                              color: '#eb5757',
                              fontSize: '12.5px',
                              lineHeight: '1.4',
                              fontWeight: 600,
                              marginBottom: '10px'
                            }}>
                              {msg.text}
                            </div>
                          )}
                          <div className={styles.previewHeader}>
                            <span className={styles.badgeDelete} style={{ marginRight: '8px' }}>Hủy buổi học</span>
                            <span className={styles.badgeExtra}>Dạy bù</span>
                          </div>
                          <h4 className={styles.previewTitle}>
                            Lớp: {msg.cancelAndMakeupPayload.cancelSession.className}
                          </h4>
                          <div className={styles.previewMeta}>
                            <div style={{ borderLeft: '3px solid #eb5757', paddingLeft: '8px', marginBottom: '8px' }}>
                              <p style={{ fontWeight: 600, fontSize: '12px', color: '#eb5757', marginBottom: '2px' }}>Buổi nghỉ:</p>
                              <div className={styles.metaItem}>
                                <Calendar size={13} className={styles.metaIcon} />
                                <span>Ngày: {msg.cancelAndMakeupPayload.cancelSession.date.split('-').reverse().join('/')}</span>
                              </div>
                            </div>
                            <div style={{ borderLeft: '3px solid #FFB000', paddingLeft: '8px' }}>
                               <p style={{ fontWeight: 600, fontSize: '12px', color: '#FFB000', marginBottom: '2px' }}>Buổi dạy bù:</p>
                              <div className={styles.metaItem}>
                                <Calendar size={13} className={styles.metaIcon} />
                                <span>Ngày: {msg.cancelAndMakeupPayload.extraSession.date.split('-').reverse().join('/')}</span>
                              </div>
                              <div className={styles.metaItem}>
                                <Clock size={13} className={styles.metaIcon} />
                                <span>Giờ học: {msg.cancelAndMakeupPayload.extraSession.start_time} - {msg.cancelAndMakeupPayload.extraSession.end_time}</span>
                              </div>
                            </div>
                          </div>
                          <div className={styles.previewActions}>
                            <button 
                              type="button" 
                              className={styles.confirmBtn}
                              style={{ backgroundColor: '#007aff', color: 'white' }}
                              onClick={() => handleConfirmCancelAndMakeup(msg.cancelAndMakeupPayload!)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              Xác nhận nghỉ bù
                            </button>
                            <button 
                              type="button" 
                              className={styles.cancelBtn}
                              onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
                              disabled={isProcessing}
                            >
                              Hủy bỏ
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isProcessing && (
                  <div className={`${styles.messageRow} ${styles.assistantRow}`}>
                    <div className={`${styles.messageBubble} ${styles.assistantBubble}`}>
                      <div className={styles.typingIndicator}>
                        <span className={styles.dot}></span>
                        <span className={styles.dot}></span>
                        <span className={styles.dot}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Interactive Tour Suggestions (Only shown in Demo Mode or to help user) */}
              {isDemoMode && (
                <div id="tour-ai-suggestions" style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  padding: '10px 0',
                  borderTop: '1px dashed var(--border)'
                }}>
                  <p style={{ width: '100%', fontSize: '11px', color: 'var(--muted-foreground)', margin: '0 0 2px 0', fontWeight: 600 }}>💡 Chọn câu lệnh mẫu để chạy thử hệ thống:</p>
                  {[
                    { label: '📝 Tạo lớp Toán 9', prompt: 'Tạo lớp Toán 9 thù lao 200k dạy Thứ 2, Thứ 4' },
                    { label: '🕒 Sửa giờ học', prompt: 'Sửa giờ học lớp Toán 7 thành 19:30' },
                    { label: '💰 Đổi thù lao', prompt: 'Đổi thù lao lớp Toán 7 thành 180k từ ngày mai' },
                    { label: '❌ Báo nghỉ dạy', prompt: 'Hôm nay lớp Toán 7 xin nghỉ nhé' },
                    { label: '🔄 Đổi lịch nghỉ bù', prompt: 'lớp Toán 7 hôm nay nghỉ bù sang Thứ 7 nhé' },
                    { label: '📊 Tính lương', prompt: 'Tính thù lao tháng 5 được bao nhiêu tiền' }
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      style={{
                        backgroundColor: 'var(--muted)',
                        border: '1.5px solid var(--border)',
                        color: 'var(--text-main)',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.backgroundColor = 'rgba(115, 91, 242, 0.05)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.backgroundColor = 'var(--muted)';
                      }}
                      onClick={async () => {
                        if (isProcessing) return;
                        setInputText('');
                        setMessages(prev => [...prev, { id: String(Date.now()), sender: 'user', text: chip.prompt }]);
                        setIsProcessing(true);
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new CustomEvent('speanut_tour_event', { detail: { type: 'ai_message_sent' } }));
                        }
                        try {
                          const lastPayload = [...messages].reverse().find(m => m.payload)?.payload;
                          const parsed = await parseMessage(chip.prompt, lastPayload);
                          const { type, data, message } = parsed;

                          const newMsg: Message = {
                            id: String(Date.now() + 1),
                            sender: 'assistant',
                            text: message || 'Đã xử lý yêu cầu.'
                          };

                          if (type === 'CREATE_CLASS') {
                            newMsg.payload = data;
                          } else if (type === 'UPDATE_CLASS_SCHEDULE') {
                            newMsg.updateSchedulePayload = data;
                          } else if (type === 'UPDATE_CLASS_RATE') {
                            newMsg.updateRatePayload = data;
                          } else if (type === 'DELETE_CLASS') {
                            newMsg.deleteClassPayload = data;
                          } else if (type === 'CANCEL_CLASS_SESSION') {
                            newMsg.cancelSessionPayload = data;
                          } else if (type === 'ADD_EXTRA_SESSION') {
                            newMsg.addExtraSessionPayload = data;
                          } else if (type === 'CANCEL_AND_MAKEUP') {
                            newMsg.cancelAndMakeupPayload = data;
                          } else if (type === 'ANSWER') {
                            newMsg.text = data.text;
                          }

                          setMessages(prev => [...prev, newMsg]);
                        } catch (err: any) {
                          setMessages(prev => [...prev, {
                            id: String(Date.now() + 1),
                            sender: 'assistant',
                            text: `Rất tiếc, tôi gặp lỗi: ${err.message}`,
                            error: true
                          }]);
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Input */}
              <div className={styles.chatInputRow} id="tour-ai-input">
                <input 
                  type="text" 
                  className={styles.chatInput}
                  placeholder="Hỏi lương, sửa lịch hoặc mô tả lớp..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  disabled={isProcessing}
                />
                <button 
                  type="button" 
                  className={styles.sendBtn}
                  onClick={handleSendChat}
                  disabled={!inputText.trim() || isProcessing}
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
