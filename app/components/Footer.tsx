'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Instagram, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: '60px',
        padding: '40px 20px 20px 20px',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--card)',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        width: '100%',
        boxSizing: 'border-box',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.02)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '32px',
          width: '100%',
        }}
      >
        {/* Brand Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Image
              src="/peanut.png"
              alt="SPeanut Logo"
              width={32}
              height={32}
              style={{ objectFit: 'contain' }}
            />
            <span
              style={{
                fontSize: '20px',
                fontWeight: '800',
                color: 'var(--primary, #735BF2)',
                letterSpacing: '0.05em',
              }}
            >
              SPeanut
            </span>
          </div>
          <p
            style={{
              fontSize: '13.5px',
              lineHeight: '1.6',
              color: 'var(--muted-foreground)',
              margin: 0,
            }}
          >
            Hệ thống quản lý thù lao giảng dạy và sắp xếp lịch biểu thông minh hàng đầu dành cho các thầy cô và trợ giảng. Tối ưu quy trình tính lương, minh bạch dữ liệu.
          </p>
        </div>

        {/* Contact Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4
            style={{
              fontSize: '15px',
              fontWeight: '700',
              color: 'var(--foreground)',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Liên hệ hỗ trợ
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: 'var(--muted-foreground)' }}>
              <Mail size={16} style={{ color: 'var(--primary, #735BF2)', flexShrink: 0 }} />
              <a href="mailto:lan.doanhuonglan@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>lan.doanhuonglan@gmail.com</a>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: 'var(--muted-foreground)' }}>
              <Phone size={16} style={{ color: 'var(--primary, #735BF2)', flexShrink: 0 }} />
              <span>Hotline: 0982.415.010</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: 'var(--muted-foreground)' }}>
              <MapPin size={16} style={{ color: 'var(--primary, #735BF2)', flexShrink: 0 }} />
              <span>Hà Nội, Việt Nam</span>
            </li>
          </ul>
        </div>

        {/* Policy & Community */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4
            style={{
              fontSize: '15px',
              fontWeight: '700',
              color: 'var(--foreground)',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Điều khoản & Kết nối
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '16px', fontSize: '13.5px', color: 'var(--muted-foreground)' }}>
              <Link href="#" style={{ color: 'inherit', textDecoration: 'none' }} onClick={(e) => e.preventDefault()}>Chính sách bảo mật</Link>
              <span>•</span>
              <Link href="#" style={{ color: 'inherit', textDecoration: 'none' }} onClick={(e) => e.preventDefault()}>Điều khoản dịch vụ</Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--muted-foreground)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(115, 91, 242, 0.1)';
                  e.currentTarget.style.color = 'var(--primary, #735BF2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--muted)';
                  e.currentTarget.style.color = 'var(--muted-foreground)';
                }}
                title="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--muted-foreground)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(115, 91, 242, 0.1)';
                  e.currentTarget.style.color = 'var(--primary, #735BF2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--muted)';
                  e.currentTarget.style.color = 'var(--muted-foreground)';
                }}
                title="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--muted-foreground)',
                  transition: 'all 0.2s ease',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(115, 91, 242, 0.1)';
                  e.currentTarget.style.color = 'var(--primary, #735BF2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--muted)';
                  e.currentTarget.style.color = 'var(--muted-foreground)';
                }}
                title="TikTok"
              >
                T
              </a>
              <a
                href="https://speanut.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--muted-foreground)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(115, 91, 242, 0.1)';
                  e.currentTarget.style.color = 'var(--primary, #735BF2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--muted)';
                  e.currentTarget.style.color = 'var(--muted-foreground)';
                }}
                title="Website"
              >
                <Globe size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: '1px dashed var(--border)',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          width: '100%',
        }}
      >
        <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
          © {new Date().getFullYear()} SPeanut Portal. All rights reserved.
        </span>
        <span style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontWeight: '500' }}>
          Made with ❤️ for SPeanut Teachers
        </span>
      </div>
    </footer>
  );
}
