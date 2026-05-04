// Pure spending-trend math, kept dependency-free so it can be unit-tested.

const monthIndex = (date) => date.getFullYear() * 12 + date.getMonth();

const totalForOffset = (receipts, now, offset) => {
  const target = monthIndex(now) - offset;
  return receipts.reduce((sum, r) => {
    const d = new Date(r.purchased_at);
    if (Number.isNaN(d.getTime())) return sum;
    return monthIndex(d) === target ? sum + (r.total || 0) : sum;
  }, 0);
};

export const monthOverMonthTrend = (receipts, now = new Date()) => {
  const current = totalForOffset(receipts, now, 0);
  const previous = totalForOffset(receipts, now, 1);

  if (current === 0 && previous === 0) {
    return { current, previous, direction: 'flat', label: null };
  }
  if (previous === 0) {
    return { current, previous, direction: 'up', label: 'first spend this month' };
  }
  if (current === 0) {
    return { current, previous, direction: 'down', label: '100% less than last month' };
  }
  const pct = ((current - previous) / previous) * 100;
  const rounded = Math.round(pct);
  if (rounded === 0) {
    return { current, previous, direction: 'flat', label: 'same as last month' };
  }
  const direction = rounded > 0 ? 'up' : 'down';
  const label = `${Math.abs(rounded)}% ${direction === 'up' ? 'more' : 'less'} than last month`;
  return { current, previous, direction, label };
};
