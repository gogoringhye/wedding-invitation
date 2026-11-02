document.addEventListener('DOMContentLoaded', () => {
  const copyButtons = document.querySelectorAll('.copy-btn');

  copyButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const value = button.getAttribute('data-copy');
      if (!value) return;

      try {
        await navigator.clipboard.writeText(value);
        window.showToast?.('계좌번호가 복사되었습니다.');
      } catch (error) {
        window.showToast?.('복사에 실패했습니다. 수동으로 복사해 주세요.');
      }
    });
  });
});
