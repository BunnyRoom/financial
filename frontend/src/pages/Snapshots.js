import React, { useState } from 'react';
import { Scissors, Plus, Trash2, TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';
import { useApp } from '../context/AppContext';
import { snapshotAPI, settingsAPI } from '../utils/api';
import { formatCurrency, formatDateTimeTH, nowGMT7ISO, toGMT7ISO } from '../utils/format';

function CutModal({ summary, onClose, onDone }) {
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCut = async () => {
    const result = await Swal.fire({
      icon: 'question',
      title: '✂️ ยืนยันตัดยอด?',
      html: `
        <div style="text-align:left;padding:8px 0;line-height:2">
          <div>💰 รายรับงวดนี้: <b style="color:#10b981">${formatCurrency(summary?.totalIncome)}</b></div>
          <div>💸 รายจ่ายงวดนี้: <b style="color:#ef4444">${formatCurrency(summary?.totalExpense)}</b></div>
          <div>📊 ยอดที่จะยกไป: <b style="color:#6366f1">${formatCurrency(summary?.balance)}</b></div>
        </div>
        <div style="font-size:12px;color:#94a3b8;margin-top:8px">ระบบจะเริ่มงวดใหม่หลังจากตัดยอด</div>
      `,
      showCancelButton: true,
      confirmButtonText: '✂️ ตัดยอดเลย',
      cancelButtonText: 'ยกเลิก',
    });
    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      await snapshotAPI.cut({ label: label || undefined, note: note || undefined });
      await Swal.fire({
        icon: 'success',
        title: '✅ ตัดยอดสำเร็จ!',
        text: 'ระบบเริ่มงวดใหม่แล้ว ยอดถูกยกไปคำนวนแล้ว',
        timer: 2000,
        showConfirmButton: false,
      });
      onDone();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: e.message });
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">
          <Scissors size={20} color="var(--accent)" /> ตัดยอดงวดปัจจุบัน
        </div>

        {/* Summary preview */}
        <div style={{
          background: 'var(--bg-elevated)', borderRadius: 12,
          padding: 18, marginBottom: 22, border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            สรุปงวดปัจจุบัน
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            {[
              { label: 'รายรับ', value: summary?.totalIncome, color: '#10b981', icon: TrendingUp },
              { label: 'รายจ่าย', value: summary?.totalExpense, color: '#ef4444', icon: TrendingDown },
              { label: 'คงเหลือ', value: summary?.balance, color: '#6366f1', icon: Wallet },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <item.icon size={16} color={item.color} style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontFamily: 'Space Mono', fontSize: 14, fontWeight: 700, color: item.color }}>
                  {formatCurrency(item.value)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">ชื่องวด</label>
          <input className="form-control" type="text"
            placeholder={`งวด ${new Date().toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', year: 'numeric', month: 'long' })}`}
            value={label} onChange={e => setLabel(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">หมายเหตุ</label>
          <input className="form-control" type="text"
            placeholder="บันทึกเพิ่มเติม..." value={note} onChange={e => setNote(e.target.value)} />
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={handleCut} disabled={loading}>
            {loading ? '⏳ กำลังตัด...' : <><Scissors size={15} /> ตัดยอดเลย</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResetModal({ onClose, onDone }) {
  const [date, setDate] = useState(nowGMT7ISO());
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: '🔄 รีเซ็ตงวดใหม่?',
      text: 'วันเปิดงวดจะถูกเปลี่ยนเป็นวันที่เลือก (ไม่กระทบข้อมูลเดิม)',
      showCancelButton: true,
      confirmButtonText: 'รีเซ็ตเลย',
      cancelButtonText: 'ยกเลิก',
    });
    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      await settingsAPI.resetPeriod(toGMT7ISO(date));
      Swal.fire({ icon: 'success', title: 'รีเซ็ตสำเร็จ!', timer: 1500, showConfirmButton: false });
      onDone();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: e.message });
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-title">
          <Calendar size={20} color="var(--yellow)" /> กำหนดวันเปิดงวดใหม่
        </div>
        <div className="form-group">
          <label className="form-label">วันที่-เวลาเปิดงวด (GMT+7)</label>
          <input className="form-control" type="datetime-local"
            value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>
          ⚠️ ระบบจะนับรายการที่มีวันที่ตั้งแต่เวลาที่เลือกเป็นงวดปัจจุบัน
        </p>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={handleReset} disabled={loading}>
            {loading ? '⏳...' : '🔄 ตั้งค่าเลย'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Snapshots() {
  const { snapshots, summary, loadAll } = useApp();
  const [modal, setModal] = useState(null);

  const totalCarried = snapshots.reduce((s, snap) => s + snap.balanceCarried, 0);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      icon: 'warning', title: 'ลบประวัติตัดยอดนี้?',
      text: 'ยอดยกมาในการคำนวนจะเปลี่ยนแปลง ต้องการดำเนินการต่อ?',
      showCancelButton: true,
      confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;
    try {
      await snapshotAPI.delete(id);
      await loadAll();
      Swal.fire({ icon: 'success', title: 'ลบแล้ว!', timer: 1200, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: e.message });
    }
  };

  const onDone = async () => { await loadAll(); setModal(null); };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">✂️ ตัดยอดและงวด</h1>
          <p className="page-subtitle">ยอดรวมที่ยกมาทั้งหมด: {formatCurrency(totalCarried)}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setModal('reset')}>
            <Calendar size={15} /> กำหนดงวดใหม่
          </button>
          <button className="btn btn-primary" onClick={() => setModal('cut')}>
            <Scissors size={15} /> ตัดยอดงวดนี้
          </button>
        </div>
      </div>

      {/* Current period card */}
      <div className="card card-glow" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 18 }}>
          งวดปัจจุบัน (ยังไม่ได้ตัด)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[
            { label: 'รายรับ',    value: summary?.totalIncome,      color: '#10b981', icon: TrendingUp },
            { label: 'รายจ่าย',  value: summary?.totalExpense,     color: '#ef4444', icon: TrendingDown },
            { label: 'ยอดยกมา',  value: summary?.carriedBalance,   color: '#6366f1', icon: Wallet },
            { label: 'คงเหลือ',  value: summary?.balance,          color: '#f59e0b', icon: Wallet },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '10px 0' }}>
              <item.icon size={18} color={item.color} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
              <div style={{ fontFamily: 'Space Mono', fontSize: 17, fontWeight: 700, color: item.color }}>
                {formatCurrency(item.value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="section-title">ประวัติการตัดยอด ({snapshots.length} งวด)</div>

      {snapshots.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Scissors size={36} />
            <h3>ยังไม่เคยตัดยอด</h3>
            <p>กดปุ่ม "ตัดยอดงวดนี้" เพื่อบันทึกยอดและเริ่มงวดใหม่</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {snapshots.map((snap, i) => (
            <div key={snap.id} className="card" style={{
              borderLeft: '3px solid var(--accent)',
              padding: '18px 22px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{
                      background: 'var(--accent-glow)', color: 'var(--accent-2)',
                      padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600
                    }}>งวด #{snapshots.length - i}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{snap.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>ตัดเมื่อ</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDateTimeTH(snap.cutDate)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>เปิดงวด</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDateTimeTH(snap.periodStart)}</div>
                    </div>
                    {snap.note && (
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>หมายเหตุ</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{snap.note}</div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>จำนวนรายการ</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{snap.transactionCount} รายการ</div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>รายรับ</div>
                    <div style={{ fontFamily: 'Space Mono', fontSize: 13, color: '#10b981', fontWeight: 700 }}>+{formatCurrency(snap.totalIncome)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>รายจ่าย</div>
                    <div style={{ fontFamily: 'Space Mono', fontSize: 13, color: '#ef4444', fontWeight: 700 }}>-{formatCurrency(snap.totalExpense)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>ยอดยกไป</div>
                    <div style={{ fontFamily: 'Space Mono', fontSize: 15, color: 'var(--accent-2)', fontWeight: 700 }}>{formatCurrency(snap.balanceCarried)}</div>
                  </div>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(snap.id)}
                    style={{ color: 'var(--red)' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === 'cut' && <CutModal summary={summary} onClose={() => setModal(null)} onDone={onDone} />}
      {modal === 'reset' && <ResetModal onClose={() => setModal(null)} onDone={onDone} />}
    </div>
  );
}
