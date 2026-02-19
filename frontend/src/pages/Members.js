import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Users, Crown, User } from 'lucide-react';
import Swal from 'sweetalert2';
import { useApp } from '../context/AppContext';
import { memberAPI } from '../utils/api';
import { formatCurrency } from '../utils/format';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#06b6d4'];

function MemberModal({ member, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:  member?.name  || '',
    role:  member?.role  || 'member',
    color: member?.color || COLORS[0],
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim())
      return Swal.fire({ icon: 'warning', title: 'กรอกชื่อสมาชิก' });
    setLoading(true);
    try {
      const payload = { ...form, avatar: form.name.charAt(0).toUpperCase() };
      if (member?.id) {
        await memberAPI.update(member.id, payload);
        Swal.fire({ icon: 'success', title: 'อัปเดตแล้ว!', timer: 1200, showConfirmButton: false });
      } else {
        await memberAPI.create(payload);
        Swal.fire({ icon: 'success', title: 'เพิ่มสมาชิกแล้ว!', timer: 1200, showConfirmButton: false });
      }
      onSaved();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: e.message });
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-title">
          <Users size={20} color="var(--accent)" />
          {member?.id ? 'แก้ไขสมาชิก' : 'เพิ่มสมาชิก'}
        </div>

        {/* Preview */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <div className="avatar" style={{
            width: 64, height: 64, fontSize: 26,
            background: `${form.color}33`, color: form.color, borderRadius: 18,
            boxShadow: `0 0 20px ${form.color}44`
          }}>
            {form.name.charAt(0).toUpperCase() || '?'}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">ชื่อสมาชิก</label>
          <input className="form-control" type="text" placeholder="กรอกชื่อ..."
            value={form.name} onChange={e => set('name', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">บทบาท</label>
          <select className="form-control" value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">สี</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => set('color', c)} style={{
                width: 32, height: 32, borderRadius: 8, border: 'none',
                background: c, cursor: 'pointer',
                outline: form.color === c ? `3px solid #fff` : '3px solid transparent',
                transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.15s',
              }} />
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? '⏳...' : member?.id ? '💾 บันทึก' : '➕ เพิ่มสมาชิก'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Members() {
  const { members, summary, loadAll } = useApp();
  const [modal, setModal] = useState(null);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      icon: 'warning', title: 'ลบสมาชิกนี้?',
      text: 'รายการของสมาชิกยังคงอยู่ แต่จะไม่เชื่อมกับสมาชิกนี้',
      showCancelButton: true, confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;
    try {
      await memberAPI.delete(id);
      await loadAll();
      Swal.fire({ icon: 'success', title: 'ลบแล้ว!', timer: 1200, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: e.message });
    }
  };

  const onSaved = async () => { await loadAll(); setModal(null); };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 สมาชิก</h1>
          <p className="page-subtitle">{members.length} สมาชิก</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})}>
          <Plus size={16} /> เพิ่มสมาชิก
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {members.map(m => {
          const mSummary = summary?.byMember?.[m.id] || {};
          const net = (mSummary.income || 0) - (mSummary.expense || 0);
          return (
            <div key={m.id} className="card" style={{
              borderTop: `3px solid ${m.color}`,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px ${m.color}44`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="avatar" style={{
                    width: 48, height: 48, fontSize: 20,
                    background: `${m.color}22`, color: m.color, borderRadius: 14,
                    boxShadow: `0 0 16px ${m.color}33`,
                  }}>{m.avatar}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                      {m.role === 'admin' ? <Crown size={11} color={m.color} /> : <User size={11} />}
                      {m.role === 'admin' ? 'Admin' : 'Member'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal({ member: m })}>
                    <Pencil size={13} />
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(m.id)}
                    style={{ color: 'var(--red)' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>รายรับ</div>
                  <div style={{ fontFamily: 'Space Mono', fontSize: 12, color: '#10b981', fontWeight: 700 }}>
                    {formatCurrency(mSummary.income || 0)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>รายจ่าย</div>
                  <div style={{ fontFamily: 'Space Mono', fontSize: 12, color: '#ef4444', fontWeight: 700 }}>
                    {formatCurrency(mSummary.expense || 0)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>กำไร</div>
                  <div style={{ fontFamily: 'Space Mono', fontSize: 12, color: net >= 0 ? '#6366f1' : '#ef4444', fontWeight: 700 }}>
                    {formatCurrency(net)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {members.length === 0 && (
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state">
              <Users size={36} />
              <h3>ยังไม่มีสมาชิก</h3>
              <p>กดเพิ่มสมาชิกเพื่อเริ่มต้น</p>
            </div>
          </div>
        )}
      </div>

      {modal !== null && (
        <MemberModal member={modal.member} onClose={() => setModal(null)} onSaved={onSaved} />
      )}
    </div>
  );
}
