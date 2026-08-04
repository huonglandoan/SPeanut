// @/lib/openclaw-auth.ts
import { createClient } from '@supabase/supabase-js';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, x-user-id, x-user-email',
};

export function handleCorsOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export interface OpenClawAuthResult {
  authenticated: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    bank_brand?: string;
    bank_number?: string;
    bank_owner?: string;
    extra_incomes?: Record<string, any>;
    cancelled_sessions?: Record<string, any>;
  };
  supabase?: any;
}

export async function verifyOpenClawAuth(request: Request): Promise<OpenClawAuthResult> {
  try {
    const authHeader = request.headers.get('authorization');
    const xApiKey = request.headers.get('x-api-key');

    let providedKey = '';
    if (authHeader) {
      const cleanHeader = authHeader.trim();
      if (cleanHeader.toLowerCase().startsWith('bearer ')) {
        providedKey = cleanHeader.substring(7).trim();
      } else {
        providedKey = cleanHeader;
      }
    } else if (xApiKey) {
      providedKey = xApiKey.trim();
    }
    providedKey = providedKey.replace(/^['"]|['"]$/g, '');

    const validKey = (process.env.OPENCLAW_API_KEY || 'speanut_sk_openclaw_2026').trim();

    // Allow if providedKey matches validKey OR default fallback key
    if (!providedKey || (providedKey !== validKey && providedKey !== 'speanut_sk_openclaw_2026')) {
      return {
        authenticated: false,
        error: 'Unauthorized: Invalid or missing API Key. Please provide Authorization: Bearer speanut_sk_openclaw_2026',
      };
    }

    // Initialize Supabase Admin/Anon Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        authenticated: false,
        error: 'Server Error: Supabase URL/Key environment variables are not configured.',
      };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const requestedUserId = request.headers.get('x-user-id');
    const requestedUserEmail = request.headers.get('x-user-email');

    let targetUser: any = null;

    if (requestedUserId) {
      const { data } = await supabase.from('users').select('*').eq('id', requestedUserId).single();
      if (data) targetUser = data;
    }

    if (!targetUser && requestedUserEmail) {
      const { data } = await supabase.from('users').select('*').ilike('email', requestedUserEmail.trim());
      if (data && data.length > 0) targetUser = data[0];
    }

    // Fallback: If specified user not found or not passed, pick the most recent user in public.users
    if (!targetUser) {
      const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(1);
      if (data && data.length > 0) targetUser = data[0];
    }

    if (!targetUser) {
      return {
        authenticated: false,
        error: 'User account not found in public.users table.',
      };
    }

    return {
      authenticated: true,
      user: targetUser,
      supabase,
    };
  } catch (err: any) {
    return {
      authenticated: false,
      error: `Internal Server Error during auth: ${err.message || err}`,
    };
  }
}
