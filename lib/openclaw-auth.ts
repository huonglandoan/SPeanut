// @/lib/openclaw-auth.ts
import { createClient } from '@supabase/supabase-js';

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
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      providedKey = authHeader.substring(7).trim();
    } else if (xApiKey) {
      providedKey = xApiKey.trim();
    }

    const validKey = process.env.OPENCLAW_API_KEY || 'speanut_sk_openclaw_2026';

    if (!providedKey || providedKey !== validKey) {
      return {
        authenticated: false,
        error: 'Unauthorized: Invalid or missing API Key. Please provide Authorization: Bearer <API_KEY> or x-api-key header.',
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

    // Optional: Allow specifying target user via x-user-id or x-user-email header, or default to first user
    const requestedUserId = request.headers.get('x-user-id');
    const requestedUserEmail = request.headers.get('x-user-email');
    let userQuery = supabase.from('users').select('*');

    if (requestedUserId) {
      userQuery = userQuery.eq('id', requestedUserId);
    } else if (requestedUserEmail) {
      userQuery = userQuery.eq('email', requestedUserEmail);
    } else {
      userQuery = userQuery.order('created_at', { ascending: true }).limit(1);
    }

    const { data: users, error: userError } = await userQuery;

    if (userError || !users || users.length === 0) {
      return {
        authenticated: false,
        error: 'User account not found in public.users table.',
      };
    }

    const targetUser = users[0];

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
