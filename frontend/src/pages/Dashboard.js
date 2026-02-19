import React from 'react';
import {
  TrendingUp, TrendingDown, Wallet, Activity,
  ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateTimeTH } from '../utils/format';

const PIE_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', fontSize: 13
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {formatCurrency(p.value)}
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { summary, transactions, categories, members, loadAll, loading } = useApp();

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <div className="skeleton" style={{ width: 180, height: 28, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 240, height: 16 }} />
          </div>
        </div>
        <div className="stat-grid">
          {[1,2,3,4].map(i => (
            <div key={i} className="stat-card">
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 14 }} />
              <div className="skeleton" style={{ width: 80, height: 14, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 130, height: 26 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const s = summary || {};
  const recentTxns = [...(transactions || [])].slice(0, 8);
  const catMap = {};
  (categories || []).forEach(c => { catMap[c.id] = c; });
  const memberMap = {};
  (members || []).forEach(m => { memberMap[m.id] = m; });

  // Build expense by category for pie
  const expenseData = Object.entries(s.byCategory || {})
    .map(([catId, vals]) => ({
      name: catMap[catId]?.name || catId,
      value: vals.expense,
      income: vals.income
    }))
    .filter(d => d.value > 0 || d.income > 0)
    .slice(0, 8);

  // Bar chart: income vs expense by category
  const barData = expenseData.map(d => ({
    name: d.name.length > 8 ? d.name.slice(0, 8) + '…' : d.name,
    รายรับ: d.income,
    รายจ่าย: d.value,
  }));

  // Timeline from transactions (last 7 days)
  const today = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const areaData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', month: 'short', day: 'numeric' });
    const dayTxns = (transactions || []).filter(t => t.date.slice(0, 10) === dayStr);
    areaData.push({
      date: label,
      รายรับ: dayTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      รายจ่าย: dayTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    });
  }

  const statCards = [
    {
      label: 'ยอดคงเหลือ', value: formatCurrency(s.balance),
      icon: Wallet, color: '#6366f1', glow: 'rgba(99,102,241,0.2)',
      sub: s.carriedBalance ? `ยกมา ${formatCurrency(s.carriedBalance)}` : 'งวดปัจจุบัน'
    },
    {
      label: 'รายรับงวดนี้', value: formatCurrency(s.totalIncome),
      icon: TrendingUp, color: '#10b981', glow: 'rgba(16,185,129,0.2)',
      sub: `${s.transactionCount || 0} รายการ`
    },
    {
      label: 'รายจ่ายงวดนี้', value: formatCurrency(s.totalExpense),
      icon: TrendingDown, color: '#ef4444', glow: 'rgba(239,68,68,0.2)',
      sub: `กำไรสุทธิ: ${formatCurrency(s.netCurrentPeriod)}`
    },
    {
      label: 'กำไรงวดนี้', value: formatCurrency(s.netCurrentPeriod),
      icon: Activity, color: (s.netCurrentPeriod || 0) >= 0 ? '#10b981' : '#ef4444',
      glow: (s.netCurrentPeriod || 0) >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
      sub: `เปิดงวด: ${s.periodStart ? new Date(s.periodStart).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', month: 'short', day: 'numeric' }) : '-'}`
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 ภาพรวมการเงิน</h1>
          <p className="page-subtitle">
            งวดเปิด: {s.periodStart ? new Date(s.periodStart).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={loadAll}>
          <RefreshCw size={14} /> รีเฟรช
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {statCards.map((c, i) => (
          <div key={i} className="stat-card" style={{ '--accent-color': c.color, '--icon-bg': c.glow }}>
            <div className="stat-icon">
              <c.icon size={22} />
            </div>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
            <div className="stat-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Area Chart */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 18 }}>รายรับ-รายจ่าย 7 วันล่าสุด</div>
          <div className="chart-container">
            <ResponsiveContainer>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="รายรับ" stroke="#10b981" fill="url(#gIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="รายจ่าย" stroke="#ef4444" fill="url(#gExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 18 }}>รายรับ-รายจ่ายตามหมวดหมู่</div>
          {barData.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <p>ยังไม่มีข้อมูลหมวดหมู่</p>
            </div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer>
                <BarChart data={barData} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="รายรับ" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="รายจ่าย" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Pie + Recent */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>
        {/* Pie */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 14 }}>สัดส่วนรายจ่าย</div>
          {expenseData.filter(d => d.value > 0).length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <p>ยังไม่มีรายจ่าย</p>
            </div>
          ) : (
            <div style={{ height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={expenseData.filter(d => d.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={90}
                    paddingAngle={3}
                  >
                    {expenseData.filter(d => d.value > 0).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'Kanit'
                  }} />
                  <Legend
                    iconType="circle" iconSize={8}
                    formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 14 }}>รายการล่าสุด</div>
          {recentTxns.length === 0 ? (
            <div className="empty-state">
              <p>ยังไม่มีรายการ</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentTxns.map(t => {
                const cat = catMap[t.categoryId];
                const mem = memberMap[t.memberId];
                const isIncome = t.type === 'income';
                return (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '10px 14px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 10,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: isIncome ? 'var(--green-glow)' : 'var(--red-glow)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                    }}>
                      {isIncome
                        ? <ArrowUpRight size={18} color="var(--green)" />
                        : <ArrowDownRight size={18} color="var(--red)" />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cat?.name || 'ไม่มีหมวด'}
                        {t.note && <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>— {t.note}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 10 }}>
                        <span>{mem?.name || '-'}</span>
                        <span>{formatDateTimeTH(t.date)}</span>
                      </div>
                    </div>
                    <div className={isIncome ? 'amount-income' : 'amount-expense'} style={{ fontSize: 14, flexShrink: 0 }}>
                      {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
