// services/profile.ts

export interface ProfileData {
  id?: string;
  email?: string;
  full_name?: string;
  avatar?: string;
  bank_brand?: string;
  bank_number?: string;
  bank_owner?: string;
  qr_code?: string;
  extra_incomes?: Record<string, any>;
}

/**
 * Lấy thông tin profile của user hiện tại từ server
 */
export async function fetchProfile(): Promise<ProfileData> {
  const response = await fetch('/api/profile', { credentials: 'same-origin' });
  let data: any;
  try {
    data = await response.json();
  } catch (err) {
    const text = await response.text();
    throw new Error(response.ok ? text : (text || 'Không thể tải thông tin cá nhân.'));
  }

  // If user is not authenticated, return an empty profile object so the UI can handle it gracefully.
  if (response.status === 401) {
    return {} as ProfileData;
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Không thể tải thông tin cá nhân.');
  }

  return data as ProfileData;
}

/**
 * Cập nhật thông tin profile của user hiện tại lên server
 */
export async function updateProfile(profileData: Partial<ProfileData>): Promise<ProfileData> {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });

  let data: any;
  try {
    data = await response.json();
  } catch (err) {
    const text = await response.text();
    throw new Error(response.ok ? text : (text || 'Không thể lưu thông tin cá nhân.'));
  }

  if (response.status === 401) {
    throw new Error('Chưa đăng nhập. Vui lòng đăng nhập để cập nhật thông tin.');
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Không thể lưu thông tin cá nhân.');
  }

  return data as ProfileData;
}
