// Format currency THB
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency', currency: 'THB',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

export const formatNumber = (n) =>
  new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n || 0);

// GMT+7 display
export const formatDateTH = (isoStr) => {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleDateString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

export const formatDateTimeTH = (isoStr) => {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export const nowGMT7ISO = () => {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 16); // for datetime-local input
};

export const toGMT7ISO = (localStr) => {
  // localStr is from datetime-local input (YYYY-MM-DDTHH:mm)
  if (!localStr) return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace('Z', '+07:00');
  return localStr + ':00+07:00';
};
