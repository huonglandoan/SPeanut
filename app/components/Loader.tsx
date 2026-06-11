'use client';

import Image from 'next/image';

interface LoaderProps {
  text?: string;
  size?: number;
  fullscreen?: boolean;
}

export function PeanutLoader({ size = 80, fullscreen = false }: LoaderProps) {
  const containerStyle: React.CSSProperties = fullscreen
    ? {
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(253, 246, 236, 0.95)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 20px',
        width: '100%',
      };

  return (
    <div style={containerStyle}>
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Image
          src="/peanut.png"
          alt="SPeanut Loader"
          width={size}
          height={size}
          style={{ objectFit: 'contain' }}
          className="rotatePeanut"
        />
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div
      style={{
        padding: '20px',
        borderRadius: '20px',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="shimmer" style={{ width: '40%', height: '18px', borderRadius: '4px' }} />
        <div className="shimmer" style={{ width: '20%', height: '14px', borderRadius: '4px' }} />
      </div>
      <div className="shimmer" style={{ width: '60%', height: '24px', borderRadius: '6px' }} />
      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="shimmer" style={{ width: '30%', height: '14px', borderRadius: '4px' }} />
        <div className="shimmer" style={{ width: '20%', height: '14px', borderRadius: '4px' }} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div
      style={{
        width: '100%',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        backgroundColor: 'var(--card)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '16px', backgroundColor: 'var(--muted)', display: 'flex', gap: '20px' }}>
        <div className="shimmer" style={{ width: '5%', height: '14px', borderRadius: '4px' }} />
        <div className="shimmer" style={{ width: '30%', height: '14px', borderRadius: '4px' }} />
        <div className="shimmer" style={{ width: '15%', height: '14px', borderRadius: '4px' }} />
        <div className="shimmer" style={{ width: '20%', height: '14px', borderRadius: '4px' }} />
        <div className="shimmer" style={{ width: '30%', height: '14px', borderRadius: '4px' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: '16px',
              borderBottom: i === rows - 1 ? 'none' : '1px solid var(--border)',
              display: 'flex',
              gap: '20px',
              alignItems: 'center',
            }}
          >
            <div className="shimmer" style={{ width: '5%', height: '16px', borderRadius: '4px' }} />
            <div style={{ width: '30%', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="shimmer" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <div className="shimmer" style={{ width: '70%', height: '14px', borderRadius: '4px' }} />
                <div className="shimmer" style={{ width: '50%', height: '10px', borderRadius: '3px' }} />
              </div>
            </div>
            <div className="shimmer" style={{ width: '15%', height: '16px', borderRadius: '4px' }} />
            <div className="shimmer" style={{ width: '20%', height: '16px', borderRadius: '4px' }} />
            <div className="shimmer" style={{ width: '30%', height: '16px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
