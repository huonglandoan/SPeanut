"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchProfile, updateProfile } from '../services/profile'
import profileStyles from '../styles/Profile.module.css'
import { Edit3, X, Upload, LogOut, Loader2, HelpCircle } from "lucide-react"
import Image from 'next/image'
import { PeanutLoader } from '../components/Loader'
import { GuideModal } from '../components/Guide'

const sanitizeBankOwner = (str: string): string => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase();
};

const sanitizeBankNumber = (str: string): string => {
  return str.replace(/\D/g, "");
};

interface ProfileViewProps {
  activeNav: number;
  setActiveNav?: React.Dispatch<React.SetStateAction<number>>;
}

export default function ProfileView({ activeNav, setActiveNav }: ProfileViewProps) {
  // States for Profile information
  const [avatar, setAvatar] = useState('/avatar.png');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [bankBrand, setBankBrand] = useState('');
  const [bankNumber, setBankNumber] = useState('');
  const [bankOwner, setBankOwner] = useState('');
  const [qrCode, setQrCode] = useState('/default_qr.png');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // States for Avatar Cropping
  const [tempAvatarSrc, setTempAvatarSrc] = useState<string | null>(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const loadProfileData = async () => {
      setProfileLoading(true);
      try {
        const data = await fetchProfile();
        setAvatar(data.avatar || '/avatar.png');
        setFullName(data.full_name || '');
        setEmail(data.email || '');
        setBankBrand(data.bank_brand || '');
        setBankNumber(data.bank_number || '');
        setBankOwner(data.bank_owner || '');
        setQrCode(data.qr_code || '/default_qr.png');
        
        const { data: { session } } = await supabase.auth.getSession();
        setCanEdit(!!session);
      } catch (e) {
        console.error("Lỗi tải thông tin cá nhân từ server:", e);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email) {
            setEmail(session.user.email);
            setCanEdit(true);
          }
        } catch (_) {}
      } finally {
        setProfileLoading(false);
      }
    };

    if (activeNav === 3) {
      loadProfileData();
    }
  }, [activeNav]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempAvatarSrc(reader.result as string);
        setCropScale(1);
        setCropOffset({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setCropOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleCropConfirm = () => {
    if (!tempAvatarSrc) return;
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 150;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        
        const boxSize = 200;
        const ratio = size / boxSize;
        
        let displayHeight = 200;
        let displayWidth = (img.width / img.height) * 200;
        if (displayWidth < 200) {
          displayWidth = 200;
          displayHeight = (img.height / img.width) * 200;
        }
        
        const finalWidth = displayWidth * cropScale;
        const finalHeight = displayHeight * cropScale;
        
        const destX = 100 - (finalWidth / 2) + cropOffset.x;
        const destY = 100 - (finalHeight / 2) + cropOffset.y;
        
        ctx.drawImage(img, destX * ratio, destY * ratio, finalWidth * ratio, finalHeight * ratio);
        setAvatar(canvas.toDataURL('image/jpeg', 0.9));
      }
      setTempAvatarSrc(null);
    };
    img.src = tempAvatarSrc;
  };

  const handleQrCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.onload = async () => {
          let qrText = '';

          // 1. Quét QR trên ảnh gốc chất lượng cao trước để tránh nhòe khi nén
          const origCanvas = document.createElement('canvas');
          origCanvas.width = img.width;
          origCanvas.height = img.height;
          const origCtx = origCanvas.getContext('2d');
          if (origCtx) {
            origCtx.drawImage(img, 0, 0);
            
            if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
              try {
                const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
                const results = await detector.detect(origCanvas);
                if (results && results.length > 0) {
                  qrText = results[0].rawValue;
                }
              } catch (e) {
                console.warn("Lỗi BarcodeDetector native trên ảnh gốc:", e);
              }
            }
            
            if (!qrText) {
              try {
                const jsQR = (await import('jsqr')).default;
                const imgData = origCtx.getImageData(0, 0, img.width, img.height);
                const decoded = jsQR(imgData.data, imgData.width, imgData.height);
                if (decoded) {
                  qrText = decoded.data;
                }
              } catch (e) {
                console.warn("Lỗi jsQR trên ảnh gốc:", e);
              }
            }
          }

          // 2. Tạo canvas thu nhỏ (maxDim = 600) để xử lý crop/hiển thị
          const canvas = document.createElement('canvas');
          const maxDim = 600;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = (h / w) * maxDim;
              w = maxDim;
            } else {
              w = (w / h) * maxDim;
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            
            // Nếu chưa quét được QR từ ảnh gốc, thử quét lại trên ảnh thu nhỏ
            if (!qrText) {
              if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
                try {
                  const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
                  const results = await detector.detect(canvas);
                  if (results && results.length > 0) {
                    qrText = results[0].rawValue;
                  }
                } catch (e) {
                  console.warn("Lỗi BarcodeDetector native trên ảnh thu nhỏ:", e);
                }
              }
              
              if (!qrText) {
                try {
                  const jsQR = (await import('jsqr')).default;
                  const imgData = ctx.getImageData(0, 0, w, h);
                  const decoded = jsQR(imgData.data, imgData.width, imgData.height);
                  if (decoded) {
                    qrText = decoded.data;
                  }
                } catch (e) {
                  console.warn("Lỗi giải mã QR bằng jsQR:", e);
                }
              }
            }

            if (qrText) {
              try {
                const parsed = parseQrTextRobust(qrText);
                if (parsed.owner) {
                  setBankOwner(parsed.owner);
                  setFullName(parsed.owner); // Tự động cập nhật họ và tên profile bằng tên chủ tài khoản ngân hàng
                }
                if (parsed.number) {
                  setBankNumber(parsed.number);
                }
                if (parsed.brand) {
                  setBankBrand(parsed.brand);
                }
              } catch (err) {
                console.error("Lỗi giải mã thông tin QR:", err);
              }
            }

            const bounds = await detectQRCodeBounds(canvas);
            
            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = 300;
            cropCanvas.height = 300;
            const cropCtx = cropCanvas.getContext('2d');
            if (cropCtx) {
              cropCtx.fillStyle = '#ffffff';
              cropCtx.fillRect(0, 0, 300, 300);
              cropCtx.drawImage(
                canvas,
                bounds.x, bounds.y, bounds.width, bounds.height,
                0, 0, 300, 300
              );
              setQrCode(cropCanvas.toDataURL('image/jpeg', 0.95));
            } else {
              setQrCode(reader.result as string);
            }
          } else {
            setQrCode(reader.result as string);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDirectQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfileLoading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new window.Image();
      img.onload = async () => {
        let qrText = '';
        let detectedOwner = '';
        let detectedNumber = '';
        let detectedBrand = '';

        // 1. Quét QR trên ảnh gốc chất lượng cao
        const origCanvas = document.createElement('canvas');
        origCanvas.width = img.width;
        origCanvas.height = img.height;
        const origCtx = origCanvas.getContext('2d');
        if (origCtx) {
          origCtx.drawImage(img, 0, 0);
          
          if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
            try {
              const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
              const results = await detector.detect(origCanvas);
              if (results && results.length > 0) {
                qrText = results[0].rawValue;
              }
            } catch (e) {
              console.warn("Lỗi BarcodeDetector native trên ảnh gốc:", e);
            }
          }
          
          if (!qrText) {
            try {
              const jsQR = (await import('jsqr')).default;
              const imgData = origCtx.getImageData(0, 0, img.width, img.height);
              const decoded = jsQR(imgData.data, imgData.width, imgData.height);
              if (decoded) {
                qrText = decoded.data;
              }
            } catch (e) {
              console.warn("Lỗi jsQR trên ảnh gốc:", e);
            }
          }
        }

        // 2. Tạo canvas thu nhỏ để xử lý crop/hiển thị
        const canvas = document.createElement('canvas');
        const maxDim = 600;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = (h / w) * maxDim;
            w = maxDim;
          } else {
            w = (w / h) * maxDim;
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          
          if (!qrText) {
            if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
              try {
                const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
                const results = await detector.detect(canvas);
                if (results && results.length > 0) {
                  qrText = results[0].rawValue;
                }
              } catch (e) {
                console.warn("Lỗi BarcodeDetector native trên ảnh thu nhỏ:", e);
              }
            }
            
            if (!qrText) {
              try {
                const jsQR = (await import('jsqr')).default;
                const imgData = ctx.getImageData(0, 0, w, h);
                const decoded = jsQR(imgData.data, imgData.width, imgData.height);
                if (decoded) {
                  qrText = decoded.data;
                }
              } catch (e) {
                console.warn("Lỗi giải mã QR bằng jsQR:", e);
              }
            }
          }

          if (qrText) {
            try {
              const parsed = parseQrTextRobust(qrText);
              if (parsed.owner) detectedOwner = parsed.owner;
              if (parsed.number) detectedNumber = parsed.number;
              if (parsed.brand) detectedBrand = parsed.brand;
            } catch (err) {
              console.error("Lỗi giải mã thông tin QR:", err);
            }
          }

          let finalQrData = reader.result as string;
          const bounds = await detectQRCodeBounds(canvas);
          if (bounds) {
            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = 300;
            cropCanvas.height = 300;
            const cropCtx = cropCanvas.getContext('2d');
            if (cropCtx) {
              cropCtx.fillStyle = '#ffffff';
              cropCtx.fillRect(0, 0, 300, 300);
              cropCtx.drawImage(
                canvas,
                bounds.x, bounds.y, bounds.width, bounds.height,
                0, 0, 300, 300
              );
              finalQrData = cropCanvas.toDataURL('image/jpeg', 0.95);
            }
          }

          // Cập nhật các state cục bộ
          setQrCode(finalQrData);
          const cleanDetectedOwner = detectedOwner ? sanitizeBankOwner(detectedOwner) : '';
          const cleanDetectedNumber = detectedNumber ? sanitizeBankNumber(detectedNumber) : '';

          if (cleanDetectedOwner) {
            setBankOwner(cleanDetectedOwner);
            setFullName(cleanDetectedOwner);
          }
          if (cleanDetectedNumber) setBankNumber(cleanDetectedNumber);
          if (detectedBrand) setBankBrand(detectedBrand);

          // Lưu trực tiếp
          try {
            await updateProfile({
              full_name: cleanDetectedOwner || fullName,
              avatar: avatar,
              bank_brand: detectedBrand || bankBrand,
              bank_number: cleanDetectedNumber || bankNumber,
              bank_owner: cleanDetectedOwner || bankOwner,
              qr_code: finalQrData,
            });
            setToastMessage('Đã lưu ảnh QR và thông tin chuyển khoản thành công!');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
          } catch (dbErr) {
            console.error("Lỗi cập nhật profile tự động:", dbErr);
            setToastMessage('Lỗi khi đồng bộ thông tin QR lên server.');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
          }
        }
        setProfileLoading(false);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const cleanBankNumber = sanitizeBankNumber(bankNumber);
    const cleanBankOwner = sanitizeBankOwner(bankOwner);

    if (bankNumber && !/^\d+$/.test(cleanBankNumber)) {
      alert("Số tài khoản chỉ được phép chứa chữ số!");
      setSaving(false);
      return;
    }

    try {
      await updateProfile({
        full_name: cleanBankOwner || fullName,
        avatar: avatar,
        bank_brand: bankBrand,
        bank_number: cleanBankNumber,
        bank_owner: cleanBankOwner,
        qr_code: qrCode,
      });
      // Reload lại từ DB để xác nhận dữ liệu đã được lưu thành công
      const freshData = await fetchProfile();
      setAvatar(freshData.avatar || '/avatar.png');
      setFullName(freshData.full_name || '');
      setEmail(freshData.email || '');
      setBankBrand(freshData.bank_brand || '');
      setBankNumber(freshData.bank_number || '');
      setBankOwner(freshData.bank_owner || '');
      setQrCode(freshData.qr_code || '/default_qr.png');
      setIsEditModalOpen(false);
      setToastMessage('Đã lưu thay đổi thành công!');
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (err: any) {
      console.error('Lỗi lưu profile:', err);
      setToastMessage('Lỗi khi lưu thông tin. Vui lòng thử lại.');
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={profileStyles.profileWrapper}>
      {/* Loading State */}
      {profileLoading ? (
        <div className={profileStyles.profileCard} style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PeanutLoader text="Đang tải thông tin cá nhân..." />
        </div>
      ) : (
      <>
      {/* Preview Card */}
      <div className={profileStyles.profileCard}>
        {canEdit && (
          <button
            type="button"
            className={profileStyles.editBtn}
            onClick={() => setIsEditModalOpen(true)}
            title="Chỉnh sửa thông tin"
          >
            <Edit3 size={18} />
          </button>
        )}

        <div className={profileStyles.avatarContainer}>
          <div style={avatar === '/avatar.png' ? { position: 'relative', width: '100%', height: '100%', borderRadius: '50%', backgroundColor: 'var(--bg-card)', overflow: 'hidden' } : { position: 'relative', width: '100%', height: '100%' }}>
            <Image 
              src={avatar} 
              alt="Avatar" 
              unoptimized
              fill
              style={avatar === '/avatar.png' ? { objectFit: 'contain', padding: '15px' } : { objectFit: 'cover' }}
              className={avatar === '/avatar.png' ? '' : profileStyles.avatarImage} 
            />
          </div>
        </div>
        
        <h2 className={profileStyles.displayName}>{fullName || 'User'}</h2>
        <span className={profileStyles.roleBadge}>
          {email === 'admin@speanut.com' || email === '111111@speanut.com' ? 'Admin' : 'User'}
        </span>

        <div className={profileStyles.qrSection}>
          <h4 className={profileStyles.sectionTitle} style={{ textAlign: 'center', paddingLeft: 0 }}>QR chuyển khoản</h4>
          <div className={profileStyles.qrContainer}>
            {qrCode && qrCode !== '/default_qr.png' ? (
              <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                <Image 
                  src={qrCode} 
                  alt="QR Chuyển Khoản" 
                  unoptimized
                  fill
                  style={{ objectFit: 'contain' }}
                  className={profileStyles.qrImage}
                />
              </div>
            ) : (
              <label style={{
                width: '180px',
                height: '180px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed var(--border, #e2e8f0)',
                borderRadius: '20px',
                color: 'var(--text-main, #64748b)',
                gap: '8px',
                backgroundColor: 'rgba(115, 91, 242, 0.02)',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease, background-color 0.2s ease'
              }}
              title="Nhấn để tải lên ảnh QR của bạn"
              >
                <Upload size={32} style={{ color: 'var(--primary, #735BF2)', opacity: 0.8 }} />
                <span style={{ fontSize: '14px', fontWeight: 600, opacity: 0.8 }}>Upload your QR</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDirectQrUpload}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
          <div className={profileStyles.qrDetails}>
            {qrCode && qrCode !== '/default_qr.png' ? (
              <>
                <p className={profileStyles.qrBankName}>{bankBrand || "Chưa nhận diện được"}</p>
                <p className={profileStyles.qrAccNum}>{bankNumber || "---"}</p>
                <p className={profileStyles.qrAccOwner}>{bankOwner || "---"}</p>
              </>
            ) : (
              <div style={{ color: '#ff3b30', fontWeight: 600, fontSize: '15px', padding: '8px 0' }}>
                Chưa upload QR
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsGuideModalOpen(true)}
          className={profileStyles.guideBtn}
        >
          <HelpCircle size={18} />
          Hướng dẫn sử dụng
        </button>

        <button
          type="button"
          onClick={async () => {
            if (typeof document !== 'undefined') {
              document.cookie = 'google_provider_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
              document.cookie = 'google_provider_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            }
            await supabase.auth.signOut();
          }}
          className={profileStyles.signOutBtn}
        >
          <LogOut size={18} />
          Đăng xuất tài khoản
        </button>
      </div>

      {/* Vài dòng ngắn gọn Footer */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: '12px', 
        color: 'var(--text-muted, #94a3b8)', 
        marginTop: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        opacity: 0.8
      }}>
        <div>© {new Date().getFullYear()} SPeanut. All rights reserved.</div>
        <div>
          Zalo: <a href="https://zalo.me/0982415010" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary, #735BF2)', textDecoration: 'none', fontWeight: 600 }}>0982.415.010</a> | Email: <a href="mailto:lan.doanhuonglan@gmail.com" style={{ color: 'var(--primary, #735BF2)', textDecoration: 'none', fontWeight: 600 }}>lan.doanhuonglan@gmail.com</a>
        </div>
      </div>

      {/* Edit Form Modal */}
      {isEditModalOpen && (
        <div className={profileStyles.modalOverlay} onClick={() => { setIsEditModalOpen(false); setTempAvatarSrc(null); }}>
          <div className={profileStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={profileStyles.closeBtn}
              onClick={() => { setIsEditModalOpen(false); setTempAvatarSrc(null); }}
              title="Đóng"
            >
              <X size={18} />
            </button>

            {tempAvatarSrc ? (
              <div className={profileStyles.cropSection}>
                <h4 className={profileStyles.cropTitle}>Cắt ảnh đại diện</h4>
                <div className={profileStyles.cropWrapper}>
                  <div 
                    className={profileStyles.cropBox}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    style={{ position: 'relative', overflow: 'hidden' }}
                  >
                    <Image
                      src={tempAvatarSrc}
                      alt="Crop area"
                      unoptimized
                      fill
                      style={{
                        transform: `translate(calc(-50% + ${cropOffset.x}px), calc(-50% + ${cropOffset.y}px)) scale(${cropScale})`,
                        height: '200px',
                        width: 'auto',
                        top: '50%',
                        left: '50%',
                        position: 'absolute',
                        userSelect: 'none',
                        pointerEvents: 'none',
                        maxHeight: 'none',
                        maxWidth: 'none',
                      }}
                    />
                    <div className={profileStyles.cropMask} />
                  </div>
                </div>
                
                <div className={profileStyles.zoomControl}>
                  <label className={profileStyles.zoomLabel}>Phóng to / Thu nhỏ</label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={cropScale}
                    onChange={(e) => setCropScale(parseFloat(e.target.value))}
                    className={profileStyles.zoomSlider}
                  />
                </div>

                <div className={profileStyles.cropActions}>
                  <button 
                    type="button" 
                    onClick={() => setTempAvatarSrc(null)}
                    className={profileStyles.cropCancelBtn}
                  >
                    Hủy
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCropConfirm}
                    className={profileStyles.cropConfirmBtn}
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className={profileStyles.formSection} style={{ border: 'none', boxShadow: 'none', padding: 0 }}>
                <h4 className={profileStyles.sectionTitle} style={{ margin: 0, fontSize: '18px', textTransform: 'none', letterSpacing: 'normal' }}>
                  Chỉnh sửa thông tin
                </h4>

                <div className={profileStyles.inputGroup}>
                  <label className={profileStyles.inputLabel}>Họ và tên</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={profileStyles.inputField}
                    placeholder="Nhập họ và tên..."
                    required
                  />
                </div>

                <div className={profileStyles.inputGroup}>
                  <label className={profileStyles.inputLabel}>Email đăng nhập (Mặc định)</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    readOnly
                    className={profileStyles.inputField}
                    style={{ opacity: 0.7, cursor: 'not-allowed', backgroundColor: 'var(--bg-app)' }}
                  />
                </div>

                <div className={profileStyles.inputGroup}>
                  <label className={profileStyles.inputLabel}>Ảnh đại diện</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                    <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, backgroundColor: avatar === '/avatar.png' ? 'var(--bg-card)' : 'transparent', border: avatar === '/avatar.png' ? '2px solid var(--border, #e2e8f0)' : 'none' }}>
                      <Image 
                        src={avatar} 
                        alt="Avatar Preview" 
                        unoptimized
                        fill
                        style={avatar === '/avatar.png' ? {
                          objectFit: 'contain',
                          padding: '6px',
                        } : {
                          objectFit: 'cover',
                          border: '2px solid var(--border, #e2e8f0)',
                        }}
                        className={avatar === '/avatar.png' ? '' : profileStyles.avatarImage} 
                      />
                    </div>
                    <div className={profileStyles.fileInputWrapper} style={{ flex: 1 }}>
                      <label className={profileStyles.fileInputLabel}>
                        <Upload size={16} />
                        <span>Tải lên ảnh đại diện mới...</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className={profileStyles.fileInput}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className={profileStyles.inputGroup}>
                  <label className={profileStyles.inputLabel}>QR chuyển khoản</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {qrCode && qrCode !== '/default_qr.png' ? (
                      <div style={{ 
                        display: 'flex', 
                        gap: '16px', 
                        alignItems: 'flex-start', 
                        padding: '12px', 
                        borderRadius: '12px', 
                        border: '1px solid var(--border, #e2e8f0)', 
                        backgroundColor: 'var(--bg-app, #f8fafc)' 
                      }}>
                        <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                          <Image 
                            src={qrCode} 
                            alt="QR Preview" 
                            unoptimized
                            fill
                            style={{
                              objectFit: 'contain',
                              borderRadius: '8px',
                              backgroundColor: '#fff',
                              border: '1px solid var(--border, #e2e8f0)',
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-title, #1e293b)' }}>Thông tin nhận diện:</span>
                          <span style={{ color: 'var(--text-main, #64748b)' }}>🏦 Ngân hàng: <strong>{bankBrand || 'Chưa nhận diện'}</strong></span>
                          <span style={{ color: 'var(--text-main, #64748b)' }}>💳 Số tài khoản: <strong>{bankNumber || '---'}</strong></span>
                          <span style={{ color: 'var(--text-main, #64748b)' }}>👤 Chủ tài khoản: <strong>{bankOwner || '---'}</strong></span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ 
                        padding: '16px', 
                        borderRadius: '12px', 
                        border: '1.5px dashed var(--border, #e2e8f0)', 
                        textAlign: 'center', 
                        color: '#ff3b30', 
                        fontSize: '13px', 
                        fontWeight: 600,
                        backgroundColor: 'rgba(255, 59, 48, 0.02)'
                      }}>
                        ⚠️ Chưa upload QR (Sẽ hiển thị "Chưa upload QR")
                      </div>
                    )}
                    
                    <div className={profileStyles.fileInputWrapper}>
                      <label className={profileStyles.fileInputLabel}>
                        <Upload size={16} />
                        <span>Tải lên ảnh QR code...</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrCodeChange}
                          className={profileStyles.fileInput}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className={profileStyles.inputGroup}>
                  <label className={profileStyles.inputLabel}>Tên ngân hàng</label>
                  <input
                    type="text"
                    value={bankBrand}
                    onChange={(e) => setBankBrand(e.target.value)}
                    className={profileStyles.inputField}
                    placeholder="Ví dụ: MB BANK, Techcombank..."
                  />
                </div>

                <div className={profileStyles.inputGroup}>
                  <label className={profileStyles.inputLabel}>Số tài khoản</label>
                  <input
                    type="text"
                    value={bankNumber}
                    onChange={(e) => setBankNumber(sanitizeBankNumber(e.target.value))}
                    className={profileStyles.inputField}
                    placeholder="Ví dụ: 97042292..."
                  />
                </div>

                <div className={profileStyles.inputGroup}>
                  <label className={profileStyles.inputLabel}>Tên tài khoản (Chủ thẻ)</label>
                  <input
                    type="text"
                    value={bankOwner}
                    onChange={(e) => setBankOwner(sanitizeBankOwner(e.target.value))}
                    className={profileStyles.inputField}
                    placeholder="Ví dụ: NGUYEN VAN A..."
                  />
                </div>

                <button type="submit" className={profileStyles.saveBtn} disabled={saving}>
                  {saving ? (
                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang lưu...</>
                  ) : (
                    'Lưu thông tin'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        setActiveNav={setActiveNav}
      />

      </>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className={profileStyles.toast} style={toastMessage.includes('Lỗi') ? { backgroundColor: '#FF3B30' } : {}}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

// Helpers and Constants needed for QR Code boundaries detection and decoding

async function detectQRCodeBounds(canvas: HTMLCanvasElement): Promise<{ x: number; y: number; width: number; height: number }> {
  const width = canvas.width;
  const height = canvas.height;

  // 1. STRATEGY 1: Try using native BarcodeDetector if supported in the browser
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const formats = await (window as any).BarcodeDetector.getSupportedFormats();
      if (formats.includes('qr_code')) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const results = await detector.detect(canvas);
        if (results && results.length > 0) {
          const box = results[0].boundingBox;
          const pad = box.width * 0.15;
          const side = Math.max(box.width, box.height) + pad * 2;
          const cx = box.x + box.width / 2;
          const cy = box.y + box.height / 2;
          let x = Math.max(0, cx - side / 2);
          let y = Math.max(0, cy - side / 2);
          if (x + side > width) x = width - side;
          if (y + side > height) y = height - side;
          return { x, y, width: side, height: side };
        }
      }
    } catch (e) {
      console.warn("Native BarcodeDetector failed, falling back to custom detector:", e);
    }
  }

  // Fallback to custom image processing methods
  const ctx = canvas.getContext('2d');
  if (!ctx) return { x: 0, y: 0, width, height };
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Compute adaptive threshold (average of min and max grayscale value)
  let minVal = 255;
  let maxVal = 0;
  const grays = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    grays[i / 4] = gray;
    if (gray < minVal) minVal = gray;
    if (gray > maxVal) maxVal = gray;
  }

  const threshold = (minVal + maxVal) / 2;
  const binary = new Uint8Array(width * height);
  for (let i = 0; i < grays.length; i++) {
    binary[i] = grays[i] < threshold ? 1 : 0; // 1 = dark, 0 = light
  }

  // 2. STRATEGY 2: Finder pattern search (1:1:3:1:1 horizontal runs scan)
  const centers: Array<{ x: number; y: number }> = [];

  const checkRatio = (runs: number[]) => {
    const total = runs.reduce((a, b) => a + b, 0);
    if (total < 7) return false;
    const moduleSize = total / 7;
    const maxVariance = moduleSize * 0.4;
    return (
      Math.abs(runs[0] - moduleSize) < maxVariance &&
      Math.abs(runs[1] - moduleSize) < maxVariance &&
      Math.abs(runs[2] - 3 * moduleSize) < maxVariance * 3 &&
      Math.abs(runs[3] - moduleSize) < maxVariance &&
      Math.abs(runs[4] - moduleSize) < maxVariance
    );
  };

  const shiftRuns = (runs: number[]) => {
    runs[0] = runs[2];
    runs[1] = runs[3];
    runs[2] = runs[4];
    runs[3] = 1;
    runs[4] = 0;
  };

  for (let y = 0; y < height; y += 2) {
    let currentState = 0;
    const runLengths = [0, 0, 0, 0, 0];
    for (let x = 0; x < width; x++) {
      const pixel = binary[y * width + x];
      if (pixel === 1) {
        if (currentState % 2 === 0) {
          runLengths[currentState]++;
        } else {
          currentState++;
          runLengths[currentState]++;
        }
      } else {
        if (currentState % 2 === 1) {
          runLengths[currentState]++;
        } else {
          if (currentState === 4) {
            if (checkRatio(runLengths)) {
              centers.push({ x: x - runLengths[4] - runLengths[3] - runLengths[2] / 2, y });
            }
            shiftRuns(runLengths);
            runLengths[4] = 1;
            currentState = 4;
          } else {
            currentState++;
            runLengths[currentState]++;
          }
        }
      }
    }
  }

  const groupedCenters: Array<{ x: number; y: number; count: number }> = [];
  centers.forEach(p => {
    let found = false;
    for (const g of groupedCenters) {
      const dist = Math.hypot(g.x - p.x, g.y - p.y);
      if (dist < 15) {
        g.x = (g.x * g.count + p.x) / (g.count + 1);
        g.y = (g.y * g.count + p.y) / (g.count + 1);
        g.count++;
        found = true;
        break;
      }
    }
    if (!found) {
      groupedCenters.push({ x: p.x, y: p.y, count: 1 });
    }
  });

  if (groupedCenters.length >= 3) {
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    groupedCenters.forEach(c => {
      if (c.x < minX) minX = c.x;
      if (c.x > maxX) maxX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.y > maxY) maxY = c.y;
    });

    const qrWidth = maxX - minX;
    const qrHeight = maxY - minY;
    const paddingX = qrWidth * 0.22;
    const paddingY = qrHeight * 0.22;

    let left = Math.max(0, minX - paddingX);
    let right = Math.min(width, maxX + paddingX);
    let top = Math.max(0, minY - paddingY);
    let bottom = Math.min(height, maxY + paddingY);

    if (right - left > 20 && bottom - top > 20) {
      const side = Math.max(right - left, bottom - top);
      const centerX = (left + right) / 2;
      const centerY = (top + bottom) / 2;
      left = Math.max(0, centerX - side / 2);
      top = Math.max(0, centerY - side / 2);
      
      const finalSide = Math.min(side, Math.min(width, height));
      if (left + finalSide > width) left = width - finalSide;
      if (top + finalSide > height) top = height - finalSide;
      return { x: left, y: top, width: finalSide, height: finalSide };
    }
  }

  // 3. STRATEGY 3: Transition Density Grid Scanner
  const cellSize = 15;
  const cols = Math.floor(width / cellSize);
  const rows = Math.floor(height / cellSize);
  const density = new Int32Array(cols * rows);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const p1 = binary[y * width + x];
      const p2 = binary[y * width + x + 1];
      if (p1 !== p2) {
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);
        if (col < cols && row < rows) {
          density[row * cols + col]++;
        }
      }
    }
  }

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height - 1; y++) {
      const p1 = binary[y * width + x];
      const p2 = binary[(y + 1) * width + x];
      if (p1 !== p2) {
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);
        if (col < cols && row < rows) {
          density[row * cols + col]++;
        }
      }
    }
  }

  let maxDensity = 0;
  for (let i = 0; i < density.length; i++) {
    if (density[i] > maxDensity) maxDensity = density[i];
  }

  const densThreshold = maxDensity * 0.4;
  let sumX = 0;
  let sumY = 0;
  let count = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const d = density[r * cols + c];
      if (d > densThreshold) {
        sumX += c * cellSize + cellSize / 2;
        sumY += r * cellSize + cellSize / 2;
        count++;
      }
    }
  }

  if (count > 0) {
    const cx = sumX / count;
    const cy = sumY / count;
    
    let maxDistX = 0;
    let maxDistY = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const d = density[r * cols + c];
        if (d > densThreshold) {
          const px = c * cellSize + cellSize / 2;
          const py = r * cellSize + cellSize / 2;
          const dx = Math.abs(px - cx);
          const dy = Math.abs(py - cy);
          if (dx > maxDistX) maxDistX = dx;
          if (dy > maxDistY) maxDistY = dy;
        }
      }
    }
    
    const w = maxDistX * 2;
    const h = maxDistY * 2;
    const side = Math.max(w, h);
    const paddedSide = side * 1.15;
    
    let left = Math.max(0, cx - paddedSide / 2);
    let top = Math.max(0, cy - paddedSide / 2);
    
    const finalSide = Math.min(paddedSide, Math.min(width, height));
    if (left + finalSide > width) left = width - finalSide;
    if (top + finalSide > height) top = height - finalSide;
    
    return { x: left, y: top, width: finalSide, height: finalSide };
  }

  // 4. FINAL FALLBACK: Center Crop
  const side = Math.min(width, height) * 0.8;
  return {
    x: (width - side) / 2,
    y: (height - side) / 2,
    width: side,
    height: side
  };
}

function parseEMVCo(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  
  // Chuyển chuỗi JS (UTF-16) sang byte array UTF-8 để tính toán độ dài chính xác theo byte
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  
  let index = 0;
  const decoder = new TextDecoder('utf-8');
  
  while (index < bytes.length) {
    if (index + 4 > bytes.length) break;
    
    // Tag và độ dài đều chiếm 2 bytes
    const tag = decoder.decode(bytes.subarray(index, index + 2));
    const lenStr = decoder.decode(bytes.subarray(index + 2, index + 4));
    const len = parseInt(lenStr, 10);
    
    if (isNaN(len)) break;
    if (index + 4 + len > bytes.length) break;
    
    const valueBytes = bytes.subarray(index + 4, index + 4 + len);
    const value = decoder.decode(valueBytes);
    
    result[tag] = value;
    index += 4 + len;
  }
  return result;
}

function parseQrTextRobust(qrText: string) {
  let detectedOwner = '';
  let detectedNumber = '';
  let detectedBrand = '';

  // 1. Phân tích nếu QR là đường dẫn URL (như vietqr.io hoặc sepay.vn)
  if (qrText.startsWith('http://') || qrText.startsWith('https://')) {
    try {
      const url = new URL(qrText);
      const params = url.searchParams;
      
      const qOwner = params.get('accountName') || params.get('accName') || params.get('name') || params.get('owner');
      const qNumber = params.get('acc') || params.get('account') || params.get('accountNo') || params.get('number');
      const qBank = params.get('bank') || params.get('bankId') || params.get('code');
      
      if (qOwner) detectedOwner = decodeURIComponent(qOwner).toUpperCase();
      if (qNumber) detectedNumber = qNumber;
      if (qBank) detectedBrand = decodeURIComponent(qBank);

      // Phân tích đường dẫn của img.vietqr.io: /image/<bankId>-<accountNo>-<template>.jpg
      if (url.hostname.includes('vietqr.io') && url.pathname.startsWith('/image/')) {
        const pathParts = url.pathname.replace('/image/', '').split('-');
        if (pathParts.length >= 2) {
          if (!detectedBrand) detectedBrand = pathParts[0];
          if (!detectedNumber) detectedNumber = pathParts[1];
        }
      }
    } catch (err) {
      console.warn("Lỗi phân tích URL QR:", err);
    }
  }

  // 2. Phân tích nếu QR chứa payload chuẩn EMVCo
  if (!detectedNumber || !detectedOwner) {
    try {
      const emvData = parseEMVCo(qrText);
      if (emvData['59']) {
        detectedOwner = emvData['59'].toUpperCase();
      }
      if (emvData['38']) {
        const subData = parseEMVCo(emvData['38']);
        if (subData['01']) {
          const napasData = parseEMVCo(subData['01']);
          const bin = napasData['00'];
          const accNum = napasData['01'];
          if (accNum) {
            detectedNumber = accNum;
          }
          if (bin) {
            const brand = BANK_BINS[bin];
            if (brand) {
              detectedBrand = brand;
            }
          }
        }
      }
    } catch (err) {
      console.warn("Lỗi phân tích EMVCo:", err);
    }
  }

  if (detectedBrand) {
    detectedBrand = cleanBankBrand(detectedBrand);
  }

  return {
    owner: detectedOwner,
    number: detectedNumber,
    brand: detectedBrand
  };
}

function cleanBankBrand(brand: string): string {
  const bUpper = brand.toUpperCase();
  for (const bin in BANK_BINS) {
    const name = BANK_BINS[bin];
    if (bUpper.includes(name.toUpperCase()) || name.toUpperCase().includes(bUpper)) {
      return name;
    }
  }
  return brand.toUpperCase();
}

const BANK_BINS: Record<string, string> = {
  "970422": "MB BANK",
  "970436": "Vietcombank",
  "970407": "Techcombank",
  "970415": "VietinBank",
  "970418": "BIDV",
  "970405": "Agribank",
  "970423": "TPBank",
  "970403": "Sacombank",
  "970416": "ACB",
  "970432": "VPBank",
  "970441": "VIB",
  "970443": "SHB",
  "970437": "HDBank",
  "970448": "OCB",
  "970425": "ABBANK",
  "970428": "Nam A Bank",
  "970429": "SCB",
  "970440": "SeABank",
  "970454": "BV Bank",
  "970457": "Woori Bank",
  "970458": "Shinhan Bank",
  "546034": "LPBank",
  "970449": "LPBank",
  "970419": "NCB",
  "970430": "PG Bank",
  "970409": "Bac A Bank",
  "970412": "PVcomBank",
  "970438": "DongA Bank",
  "970452": "Kienlongbank",
  "970414": "OceanBank",
  "970442": "GPBank",
  "970439": "BaoViet Bank",
  "970446": "Co-op Bank",
  "970431": "Eximbank",
  "970433": "VietBank",
  "970455": "IBK Hanoi",
  "970456": "IBK HCM",
  "970462": "CIMB",
  "970466": "CAKE",
  "970467": "UOB",
  "970468": "Timo",
  "970421": "VRB",
  "970424": "Shinhan Bank",
  "970400": "Saigon Bank",
  "970408": "GPBank",
  "970410": "Standard Chartered",
  "970426": "MSB",
  "970427": "VietABank",
  "970434": "Indovina Bank",
  "970444": "VTVBank",
  "970447": "CB Bank"
};
