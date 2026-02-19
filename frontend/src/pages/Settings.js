import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, Database, Clock } from 'lucide-react';
import Swal from 'sweetalert2';
import { useApp } from '../context/AppContext';
import { settingsAPI } from '../utils/api';
import { formatDateTimeTH } from '../utils/format';

export default function Settings() {
  const { settings, loadAll } = useApp();
  const [form, setForm] = useState({ workspaceName: '', currency: 'THB' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settings) setForm({
      workspaceName: settings.workspaceName || '',
      currency: settings.currency || 'THB',
    });
  }, [settings]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await settingsAPI.update(form);
      await loadAll();
      Swal.fire({ icon: 'success', title: 'บันทึกการตั้งค่าแล้ว!', timer: 1500, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: e.message });
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ ตั้งค่า</h1>
          <p className="page-subtitle">กำหนดค่าระบบ Financial Hub</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Workspace settings */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SettingsIcon size={18} color="var(--accent-2)" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>ตั้งค่าทั่วไป</div>
          </div>

          <div className="form-group">
            <label className="form-label">ชื่อ Workspace</label>
            <input className="form-control" type="text"
              value={form.workspaceName}
              onChange={e => setForm(p => ({ ...p, workspaceName: e.target.value }))}
              placeholder="Financial Hub"
            />
          </div>

          <div className="form-group">
            <label className="form-label">สกุลเงิน</label>
            <select className="form-control"
              value={form.currency}
              onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
              <option value="THB">🇹🇭 THB - บาทไทย</option>
              <option value="USD">🇺🇸 USD - ดอลลาร์</option>
              <option value="EUR">🇪🇺 EUR - ยูโร</option>
            </select>
          </div>

          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? '⏳ บันทึก...' : <><Save size={15} /> บันทึกการตั้งค่า</>}
          </button>
        </div>

        {/* System info */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>ข้อมูลระบบ</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Storage', value: 'JSON File (Local)' },
              { label: 'Timezone', value: 'GMT+7 (Asia/Bangkok)' },
              { label: 'งวดปัจจุบันเปิดเมื่อ', value: formatDateTimeTH(settings?.currentPeriodStart) },
              { label: 'สร้างเมื่อ', value: formatDateTimeTH(settings?.createdAt) },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: 'var(--bg-elevated)',
                borderRadius: 8, fontSize: 13,
              }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>

          <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }} onClick={() => {
            Swal.fire({ icon: 'info', title: 'รีเฟรชข้อมูล', text: 'กำลังโหลดข้อมูลใหม่...', timer: 800, showConfirmButton: false })
              .then(() => loadAll());
          }}>
            <RefreshCw size={14} /> รีเฟรชข้อมูล
          </button>
        </div>

        {/* About */}
        <div className="card" style={{ gridColumn: '1/-1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Clock size={18} color="var(--accent-2)" />
            <div style={{ fontSize: 15, fontWeight: 600 }}>เกี่ยวกับระบบ</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Frontend', value: 'React.js + Recharts + Lucide' },
              { label: 'Backend', value: 'Node.js + Express.js' },
              { label: 'Database', value: 'JSON Files (No DB required)' },
              { label: 'Notification', value: 'SweetAlert2' },
              { label: 'Charts', value: 'Recharts' },
              { label: 'Version', value: 'v1.0.0' },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '14px', background: 'var(--bg-elevated)',
                borderRadius: 10, border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
