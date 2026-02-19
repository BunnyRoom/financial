import React, { useState } from 'react';
import {
  Plus, Search, Pencil, Trash2, TrendingUp, TrendingDown, ArrowLeftRight, Filter
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useApp } from '../context/AppContext';
import { transactionAPI } from '../utils/api';
import { formatCurrency, formatDateTimeTH, nowGMT7ISO, toGMT7ISO } from '../utils/format';

function TransactionModal({ tx, members, categories, onClose, onSaved }) {
  const [form, setForm] = useState({
    type:       tx?.type       || 'income',
    amount:     tx?.amount     || '',
    categoryId: tx?.categoryId || '',
    memberId:   tx?.memberId   || (members[0]?.id || ''),
    note:       tx?.note       || '',
    date:       tx?.date       ? tx.date.slice(0, 16) : nowGMT7ISO(),
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const cats = categories.filter(c => c.type === form.type || c.type === 'transfer' && form.type === 'transfer');

  const handleSave = async () => {
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0)
      return Swal.fire({ icon: 'warning', title: 'ระบุจำนวนเงิน', text: 'กรุณากรอกจำนวนเงินที่ถูกต้อง' });
    if (!form.categoryId)
      return Swal.fire({ icon: 'warning', title: 'เลือกหมวดหมู่', text: 'กรุณาเลือกหมวดหมู่รายการ' });
    if (!form.memberId)
      return Swal.fire({ icon: 'warning', title: 'เลือกสมาชิก', text: 'กรุณาเลือกสมาชิก' });

    setLoading(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount), date: toGMT7ISO(form.date) };
      if (tx?.id) {
        await transactionAPI.update(tx.id, payload);
        Swal.fire({ icon: 'success', title: 'อัปเดตแล้ว!', timer: 1500, showConfirmButton: false });
      } else {
        await transactionAPI.create(payload);
        Swal.fire({ icon: 'success', title: 'บันทึกแล้ว!', timer: 1500, showConfirmButton: false });
      }
      onSaved();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: e.message });
    } finally { setLoading(false); }
  };

  const typeConfig = {
    income:   { label: 'รายรับ',  icon: TrendingUp,       cls: 'active-income'   },
    expense:  { label: 'รายจ่าย', icon: TrendingDown,     cls: 'active-expense'  },
    transfer: { label: 'โอน/ยืม', icon: ArrowLeftRight,   cls: 'active-transfer' },
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">
          {tx?.id ? '✏️ แก้ไขรายการ' : '➕ เพิ่มรายการใหม่'}
        </div>

        {/* Type Tabs */}
        <div className="type-tabs">
          {Object.entries(typeConfig).map(([k, v]) => (
            <button key={k} className={`type-tab ${form.type === k ? v.cls : ''}`}
              onClick={() => { set('type', k); set('categoryId', ''); }}>
              <v.icon size={15} /> {v.label}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="form-group">
          <label className="form-label">จำนวนเงิน (บาท)</label>
          <input className="form-control" type="number" min="0" step="0.01"
            placeholder="0.00" value={form.amount}
            onChange={e => set('amount', e.target.value)}
            style={{ fontSize: 20, fontFamily: 'Space Mono', fontWeight: 700 }}
          />
        </div>

        <div className="form-row">
          {/* Category */}
          <div className="form-group">
            <label className="form-label">หมวดหมู่</label>
            <select className="form-control" value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
              <option value="">-- เลือกหมวดหมู่ --</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Member */}
          <div className="form-group">
            <label className="form-label">สมาชิก</label>
            <select className="form-control" value={form.memberId} onChange={e => set('memberId', e.target.value)}>
              <option value="">-- เลือกสมาชิก --</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date */}
        <div className="form-group">
          <label className="form-label">วันที่-เวลา (GMT+7)</label>
          <input className="form-control" type="datetime-local"
            value={form.date} onChange={e => set('date', e.target.value)} />
        </div>

        {/* Note */}
        <div className="form-group">
          <label className="form-label">หมายเหตุ</label>
          <input className="form-control" type="text" placeholder="บันทึกเพิ่มเติม..."
            value={form.note} onChange={e => set('note', e.target.value)} />
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? '⏳ กำลังบันทึก...' : tx?.id ? '💾 บันทึกการแก้ไข' : '✅ เพิ่มรายการ'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Transactions() {
  const { transactions, members, categories, loadAll } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterMember, setFilterMember] = useState('');
  const [modal, setModal] = useState(null); // null | {} | {tx}

  const memberMap = {};
  members.forEach(m => { memberMap[m.id] = m; });
  const catMap = {};
  categories.forEach(c => { catMap[c.id] = c; });

  const filtered = transactions.filter(t => {
    const matchSearch = !search ||
      t.note?.toLowerCase().includes(search.toLowerCase()) ||
      catMap[t.categoryId]?.name?.toLowerCase().includes(search.toLowerCase()) ||
      memberMap[t.memberId]?.name?.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || t.type === filterType;
    const matchMember = !filterMember || t.memberId === filterMember;
    return matchSearch && matchType && matchMember;
  });

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      icon: 'warning', title: 'ลบรายการนี้?',
      text: 'ไม่สามารถกู้คืนได้หลังจากลบ',
      showCancelButton: true,
      confirmButtonText: 'ลบเลย', cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;
    try {
      await transactionAPI.delete(id);
      await loadAll();
      Swal.fire({ icon: 'success', title: 'ลบแล้ว!', timer: 1200, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: e.message });
    }
  };

  const onSaved = async () => {
    await loadAll();
    setModal(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">💳 รายการทั้งหมด</h1>
          <p className="page-subtitle">{filtered.length} รายการ</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})}>
          <Plus size={16} /> เพิ่มรายการ
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-control" style={{ paddingLeft: 36 }}
            placeholder="ค้นหา..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{ width: 150 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">ทุกประเภท</option>
          <option value="income">รายรับ</option>
          <option value="expense">รายจ่าย</option>
          <option value="transfer">โอน/ยืม</option>
        </select>
        <select className="form-control" style={{ width: 160 }} value={filterMember} onChange={e => setFilterMember(e.target.value)}>
          <option value="">ทุกสมาชิก</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>วันที่-เวลา</th>
              <th>ประเภท</th>
              <th>หมวดหมู่</th>
              <th>สมาชิก</th>
              <th>หมายเหตุ</th>
              <th style={{ textAlign: 'right' }}>จำนวนเงิน</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <Plus size={36} />
                    <h3>ยังไม่มีรายการ</h3>
                    <p>กดปุ่ม "เพิ่มรายการ" เพื่อเริ่มต้น</p>
                  </div>
                </td>
              </tr>
            ) : filtered.map(t => {
              const cat = catMap[t.categoryId];
              const mem = memberMap[t.memberId];
              return (
                <tr key={t.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {formatDateTimeTH(t.date)}
                  </td>
                  <td>
                    <span className={`badge badge-${t.type}`}>
                      {t.type === 'income' ? <TrendingUp size={11} /> : t.type === 'expense' ? <TrendingDown size={11} /> : <ArrowLeftRight size={11} />}
                      {t.type === 'income' ? 'รายรับ' : t.type === 'expense' ? 'รายจ่าย' : 'โอน'}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '3px 10px', borderRadius: 999, fontSize: 12,
                      background: `${cat?.color || '#64748b'}22`,
                      color: cat?.color || 'var(--text-secondary)',
                      fontWeight: 500,
                    }}>
                      {cat?.name || '—'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: `${mem?.color || '#64748b'}33`, color: mem?.color || 'var(--text-muted)', borderRadius: 7 }}>
                        {mem?.avatar || '?'}
                      </div>
                      <span style={{ fontSize: 13 }}>{mem?.name || '—'}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t.note || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={t.type === 'income' ? 'amount-income' : t.type === 'expense' ? 'amount-expense' : 'amount-transfer'}>
                      {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '~'}
                      {formatCurrency(t.amount)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal({ tx: t })}>
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(t.id)}
                        style={{ color: 'var(--red)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <TransactionModal
          tx={modal.tx}
          members={members}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
