import React, { useState } from 'react';
import {
  LayoutDashboard, ArrowLeftRight, Scissors, Users, Tag, Settings,
  TrendingUp, ChevronLeft, ChevronRight, Wallet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const navItems = [
  { id: 'dashboard',    label: 'ภาพรวม',        icon: LayoutDashboard },
  { id: 'transactions', label: 'รายการ',          icon: ArrowLeftRight },
  { id: 'snapshots',    label: 'ตัดยอด',           icon: Scissors },
  { id: 'members',      label: 'สมาชิก',           icon: Users },
  { id: 'categories',   label: 'หมวดหมู่',         icon: Tag },
  { id: 'settings',     label: 'ตั้งค่า',           icon: Settings },
];

export default function Sidebar({ page, setPage }) {
  const [collapsed, setCollapsed] = useState(false);
  const { settings } = useApp();

  return (
    <aside style={{
      width: collapsed ? 68 : 230,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      flexShrink: 0,
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 0' : '22px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 12,
        justifyContent: collapsed ? 'center' : 'flex-start',
        minHeight: 70,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #6366f1, #818cf8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 0 20px rgba(99,102,241,0.4)',
        }}>
          <Wallet size={18} color="#fff" />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {settings?.workspaceName || 'Financial Hub'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Team Finance</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = page === id;
          return (
            <button key={id} onClick={() => setPage(id)} style={{
              display: 'flex', alignItems: 'center',
              gap: 12,
              padding: collapsed ? '11px 0' : '11px 14px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 10, border: 'none', cursor: 'pointer',
              background: active ? 'var(--accent-glow)' : 'transparent',
              color: active ? 'var(--accent-2)' : 'var(--text-muted)',
              fontFamily: 'Kanit, sans-serif',
              fontSize: 14, fontWeight: active ? 600 : 400,
              transition: 'all 0.15s',
              position: 'relative',
              whiteSpace: 'nowrap', overflow: 'hidden',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
            title={collapsed ? label : ''}
            >
              {active && (
                <span style={{
                  position: 'absolute', left: 0, top: '20%', bottom: '20%',
                  width: 3, borderRadius: '0 3px 3px 0',
                  background: 'var(--accent)',
                }} />
              )}
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
              {!collapsed && label}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button onClick={() => setCollapsed(!collapsed)} style={{
        margin: '10px', padding: '10px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 10, cursor: 'pointer',
        color: 'var(--text-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
      }}>
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
