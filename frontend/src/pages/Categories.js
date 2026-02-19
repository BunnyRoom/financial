import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Tag, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { useApp } from '../context/AppContext';
import { categoryAPI } from '../utils/api';

const ICON_OPTIONS = [
  'ShoppingBag','CircleDollarSign','PackagePlus','Truck','Package',
  'Megaphone','Receipt','ArrowLeftRight','Tag','Wallet','CreditCard',
  'Store','Banknote','PiggyBank','HandCoins','Briefcase','Gift',
];

const COLORS = ['#10b981','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b','#64748b'];

function CategoryModal({ cat, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:  cat?.name  || '',
    type:  cat?.type  || 'income',
    icon:  cat?.icon  || 'Tag',
    color: cat?.color || COLORS[0],
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim())
      return Swal.fire({ icon: 'warning', title: 'กรอกชื่อหมวดหมู่' });
    setLoading(true);
    try {
      if (cat?.id) {
        await categoryAPI.update(cat.id, form);
        Swal.fire({ icon: 'success', title: 'อัปเดตแล้ว!', timer: 1200, showConfirmButton: false });
      } else {
        await categoryAPI.create(form);
        Swal.fire({ icon: 'success', title: 'เพิ่มหมวดหมู่แล้ว!', timer: 1200, showConfirmButton: false });
      }
      onSaved();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: e.message });
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-title">
          <Tag size={20} color="var(--accent)" />
          {cat?.id ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}
        </div>

        <div className="form-group">
          <label className="form-label">ชื่อหมวดหมู่</label>
          <input className="form-control" type="text" placeholder="เช่น ขายสินค้า, ค่าส่ง..."
            value={form.name} onChange={e => set('name', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">ประเภท</label>
          <div className="type-tabs">
            {[
              { k: 'income',   label: 'รายรับ',  icon: TrendingUp,     cls: 'active-income'   },
              { k: 'expense',  label: 'รายจ่าย', icon: TrendingDown,   cls: 'active-expense'  },
              { k: 'transfer', label: 'โอน',      icon: ArrowLeftRight, cls: 'active-transfer' },
            ].map(({ k, label, icon: Icon, cls }) => (
              <button key={k} className={`type-tab ${form.type === k ? cls : ''}`}
                onClick={() => set('type', k)}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">สี</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => set('color', c)} style={{
                width: 30, height: 30, borderRadius: 8, border: 'none',
                background: c, cursor: 'pointer',
                outline: form.color === c ? '3px solid #fff' : '3px solid transparent',
                transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.15s',
              }} />
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? '⏳...' : cat?.id ? '💾 บันทึก' : '➕ เพิ่มหมวดหมู่'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Categories() {
  const { categories, summary, loadAll } = useApp();
  const [modal, setModal] = useState(null);
  const [filterType, setFilterType] = useState('all');

  const filtered = filterType === 'all' ? categories : categories.filter(c => c.type === filterType);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      icon: 'warning', title: 'ลบหมวดหมู่?',
      showCancelButton: true, confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;
    try {
      await categoryAPI.delete(id);
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
          <h1 className="page-title">🏷️ หมวดหมู่</h1>
          <p className="page-subtitle">{categories.length} หมวดหมู่</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})}>
          <Plus size={16} /> เพิ่มหมวดหมู่
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all','income','expense','transfer'].map(t => (
          <button key={t} className={`btn btn-sm ${filterType === t ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterType(t)}>
            {t === 'all' ? 'ทั้งหมด' : t === 'income' ? '🟢 รายรับ' : t === 'expense' ? '🔴 รายจ่าย' : '⚪ โอน'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
        {filtered.map(cat => {
          const catStats = summary?.byCategory?.[cat.id] || {};
          return (
            <div key={cat.id} className="card" style={{
              display: 'flex', flexDirection: 'column', gap: 14,
              borderLeft: `3px solid ${cat.color}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: `${cat.color}22`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: cat.color, fontSize: 18,
                    boxShadow: `0 0 14px ${cat.color}33`
                  }}>
                    <Tag size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</div>
                    <span className={`badge badge-${cat.type}`} style={{ marginTop: 4, fontSize: 10 }}>
                      {cat.type === 'income' ? 'รายรับ' : cat.type === 'expense' ? 'รายจ่าย' : 'โอน'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal({ cat })}>
                    <Pencil size={13} />
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(cat.id)}
                    style={{ color: 'var(--red)' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state">
              <Tag size={36} />
              <h3>ไม่มีหมวดหมู่</h3>
            </div>
          </div>
        )}
      </div>

      {modal !== null && (
        <CategoryModal cat={modal.cat} onClose={() => setModal(null)} onSaved={onSaved} />
      )}
    </div>
  );
}
