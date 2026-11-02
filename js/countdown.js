document.addEventListener('DOMContentLoaded', () => {
  const targetDate = new Date('2026-11-28T14:30:00+09:00');
  const dayEl = document.getElementById('days');
  const hourEl = document.getElementById('hours');
  const minuteEl = document.getElementById('minutes');
  const secondEl = document.getElementById('seconds');
  const statusEl = document.getElementById('countdown-status');

  const pad = (value) => String(value).padStart(2, '0');

  const updateCountdown = () => {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();

    if (diff <= 0) {
      if (dayEl) dayEl.textContent = '00';
      if (hourEl) hourEl.textContent = '00';
      if (minuteEl) minuteEl.textContent = '00';
      if (secondEl) secondEl.textContent = '00';
      if (statusEl) statusEl.textContent = '예식이 시작되었습니다. 함께 축하해 주세요.';
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (60 * 60 * 24));
    const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    if (dayEl) dayEl.textContent = pad(days);
    if (hourEl) hourEl.textContent = pad(hours);
    if (minuteEl) minuteEl.textContent = pad(minutes);
    if (secondEl) secondEl.textContent = pad(seconds);

    if (statusEl) statusEl.textContent = '예식일을 기다리고 있습니다.';
  };

  updateCountdown();
  setInterval(updateCountdown, 1000);
});
