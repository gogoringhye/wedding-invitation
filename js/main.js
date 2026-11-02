document.addEventListener('DOMContentLoaded', () => {
  const config = window.WEDDING_CONFIG;
  const yearEl = document.querySelector('#year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const groomNameEl = document.querySelectorAll('[data-role="groom-name"]');
  groomNameEl.forEach((el) => {
    el.textContent = config.couple.groom;
  });

  const brideNameEl = document.querySelectorAll('[data-role="bride-name"]');
  brideNameEl.forEach((el) => {
    el.textContent = config.couple.bride;
  });

  const toast = document.getElementById('toast');
  window.showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 1800);
  };
});
