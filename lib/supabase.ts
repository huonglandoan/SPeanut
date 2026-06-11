// @/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr';

// URL và Key thật từ env vars (luôn có sẵn, không dùng placeholder)
const ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ENV_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Khởi tạo client mặc định dùng env vars thật
const defaultSupabase = typeof window !== 'undefined' 
  ? createBrowserClient(ENV_URL, ENV_KEY) 
  : (null as any);

// Hàm lấy client đang hoạt động (tùy biến từ localStorage hoặc mặc định)
const getActiveClient = () => {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('speanut_config_supabase_url');
    const customAnonKey = localStorage.getItem('speanut_config_supabase_anon_key');
    if (customUrl && customAnonKey) {
      try {
        return createBrowserClient(customUrl, customAnonKey);
      } catch (e) {
        console.error("Lỗi khởi tạo custom Supabase client:", e);
      }
    }
  }
  return defaultSupabase;
};

// Export proxy để tất cả các component dùng import { supabase } from '@/lib/supabase' tự động sử dụng db động
export const supabase = new Proxy({}, {
  get(target, prop, receiver) {
    const activeClient = getActiveClient();
    if (!activeClient) return undefined;
    const value = activeClient[prop];
    if (typeof value === 'function') {
      return value.bind(activeClient);
    }
    return value;
  }
}) as any;

// Intercept fetch client-side để tự động đính kèm custom database headers vào các API routes gọi lên Next.js backend
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    const customUrl = localStorage.getItem('speanut_config_supabase_url');
    const customAnonKey = localStorage.getItem('speanut_config_supabase_anon_key');
    
    if (customUrl && customAnonKey) {
      init = init || {};
      let headersObj: Record<string, string> = {};
      
      if (init.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => {
            headersObj[key] = value;
          });
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([key, value]) => {
            headersObj[key] = value;
          });
        } else {
          headersObj = { ...init.headers } as Record<string, string>;
        }
      }
      
      headersObj['x-supabase-url'] = customUrl;
      headersObj['x-supabase-anon-key'] = customAnonKey;
      init.headers = headersObj;
    }
    return originalFetch(input, init);
  };
}