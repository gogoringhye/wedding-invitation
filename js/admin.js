document.addEventListener('DOMContentLoaded', () => {
  const loginPanel = document.getElementById('admin-login-panel');
  const dashboard = document.getElementById('admin-dashboard');
  const loginForm = document.getElementById('admin-login-form');
  const logoutButton = document.getElementById('admin-logout');
  const refreshButton = document.getElementById('guestbook-refresh');
  const searchInput = document.getElementById('guestbook-search');
  const listRoot = document.getElementById('guestbook-admin-list');
  const statusElement = document.getElementById('admin-status');
  const countElement = document.getElementById('guestbook-count');
  const latestElement = document.getElementById('guestbook-latest');
  const accountElement = document.getElementById('admin-account');
  const config = window.WEDDING_CONFIG?.supabase;

  let entries = [];
  let client = null;
  let loading = false;

  const setStatus = (message, isError = false) => {
    statusElement.textContent = message;
    statusElement.classList.toggle('is-error', isError);
    statusElement.hidden = !message;
  };

  const setSignedIn = (user) => {
    loginPanel.hidden = Boolean(user);
    dashboard.hidden = !user;
    accountElement.textContent = user ? user.email : '';
  };

  const formatDate = (rawDate) => {
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return '날짜 정보 없음';
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  const renderEntries = () => {
    const query = searchInput.value.trim().toLocaleLowerCase('ko-KR');
    const filteredEntries = entries.filter((entry) => (
      `${entry.name} ${entry.message}`.toLocaleLowerCase('ko-KR').includes(query)
    ));

    listRoot.replaceChildren();
    const activeEntries = entries.filter((entry) => !entry.deleted_at);
    countElement.textContent = `${activeEntries.length}`;
    latestElement.textContent = activeEntries.length ? formatDate(activeEntries[0].created_at) : '-';

    if (!filteredEntries.length) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'admin-empty-state';
      emptyMessage.textContent = entries.length ? '검색 결과가 없습니다.' : '등록된 축하 메시지가 없습니다.';
      listRoot.append(emptyMessage);
      return;
    }

    filteredEntries.forEach((entry) => {
      const item = document.createElement('article');
      item.className = 'admin-guestbook-item';
      if (entry.deleted_at) item.classList.add('is-deleted');

      const content = document.createElement('div');
      content.className = 'admin-guestbook-content';

      const heading = document.createElement('div');
      heading.className = 'admin-guestbook-heading';

      const name = document.createElement('h2');
      name.className = 'admin-guestbook-name';
      name.textContent = entry.name;

      const dates = document.createElement('div');
      dates.className = 'admin-guestbook-dates';

      const createdDate = document.createElement('time');
      createdDate.className = 'admin-guestbook-date';
      createdDate.dateTime = entry.created_at;
      createdDate.textContent = `작성 ${formatDate(entry.created_at)}`;

      const updatedDate = document.createElement('time');
      updatedDate.className = 'admin-guestbook-date';
      updatedDate.dateTime = entry.updated_at || entry.created_at;
      updatedDate.textContent = `수정 ${formatDate(entry.updated_at || entry.created_at)}`;

      const message = document.createElement('p');
      message.className = 'admin-guestbook-message';
      message.textContent = entry.message;

      const actionButton = document.createElement('button');
      actionButton.type = 'button';
      actionButton.className = entry.deleted_at
        ? 'admin-restore-button'
        : 'admin-delete-button';
      actionButton.textContent = entry.deleted_at ? '복구' : '삭제';
      actionButton.setAttribute(
        'aria-label',
        `${entry.name}님의 방명록 ${entry.deleted_at ? '복구' : '삭제'}`
      );
      actionButton.addEventListener('click', () => (
        entry.deleted_at ? restoreEntry(entry) : deleteEntry(entry)
      ));

      dates.append(createdDate, updatedDate);
      heading.append(name, dates);
      content.append(heading, message);
      if (entry.deleted_at) {
        const deletedDate = document.createElement('p');
        deletedDate.className = 'admin-guestbook-deleted-date';
        deletedDate.textContent = `삭제 ${formatDate(entry.deleted_at)}`;
        content.append(deletedDate);
      }
      item.append(content, actionButton);
      listRoot.append(item);
    });
  };

  const loadEntries = async () => {
    if (loading || !client) return;
    loading = true;
    refreshButton.disabled = true;
    listRoot.textContent = '방명록을 불러오는 중입니다.';

    try {
      const { data, error } = await client
        .from('guestbook')
        .select('id, name, message, created_at, updated_at, deleted_at')
        .order('created_at', { ascending: false });
      if (error) throw error;

      entries = data;
      renderEntries();
      setStatus('');
    } catch (error) {
      listRoot.textContent = '방명록을 불러오지 못했습니다.';
      setStatus(`방명록을 불러오지 못했습니다: ${error.message}`, true);
    } finally {
      loading = false;
      refreshButton.disabled = false;
    }
  };

  const deleteEntry = async (entry) => {
    if (!window.confirm(`${entry.name}님의 방명록을 삭제할까요? 관리자 페이지에서 다시 복구할 수 있습니다.`)) return;

    setStatus('');
    try {
      const { data, error } = await client.rpc('guestbook_admin_delete', {
        p_id: entry.id
      });
      if (error) throw error;
      if (!data) throw new Error('삭제 권한이 없거나 이미 처리된 메시지입니다.');

      await loadEntries();
      setStatus('방명록을 삭제했습니다.');
    } catch (error) {
      setStatus(`방명록을 삭제하지 못했습니다: ${error.message}`, true);
    }
  };

  const restoreEntry = async (entry) => {
    setStatus('');
    try {
      const { data, error } = await client.rpc('guestbook_admin_restore', {
        p_id: entry.id
      });
      if (error) throw error;
      if (!data) throw new Error('이미 복구되었거나 찾을 수 없는 메시지입니다.');

      await loadEntries();
      setStatus('방명록을 복구했습니다.');
    } catch (error) {
      setStatus(`방명록을 복구하지 못했습니다: ${error.message}`, true);
    }
  };

  const applySession = async (session) => {
    const user = session?.user;
    if (!user) {
      setSignedIn(null);
      entries = [];
      listRoot.replaceChildren();
      return;
    }

    if (user.app_metadata?.role !== 'admin') {
      const { error } = await client.auth.signOut();
      setSignedIn(null);
      entries = [];
      listRoot.replaceChildren();
      setStatus(
        error
          ? `관리자 권한이 없는 계정입니다. 세션을 종료하지 못했습니다: ${error.message}`
          : '관리자 권한이 있는 계정만 이용할 수 있습니다.',
        true
      );
      return;
    }

    setStatus('');
    setSignedIn(user);
    await loadEntries();
  };

  if (!config?.url || !config?.anonKey) {
    setStatus('Supabase URL과 anon key를 js/config.js에 설정해 주세요.', true);
    loginForm.querySelector('button[type="submit"]').disabled = true;
    return;
  }

  if (!window.supabase?.createClient) {
    setStatus('Supabase 클라이언트를 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.', true);
    loginForm.querySelector('button[type="submit"]').disabled = true;
    return;
  }

  client = window.supabase.createClient(config.url, config.anonKey);

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('');
    const submitButton = loginForm.querySelector('button[type="submit"]');
    const formData = new FormData(loginForm);
    submitButton.disabled = true;

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: formData.get('email').trim(),
        password: formData.get('password')
      });
      if (error) throw error;
      await applySession(data.session);
    } catch (error) {
      setStatus(`로그인하지 못했습니다: ${error.message}`, true);
    } finally {
      submitButton.disabled = false;
    }
  });

  logoutButton.addEventListener('click', async () => {
    logoutButton.disabled = true;
    try {
      const { error } = await client.auth.signOut();
      if (error) throw error;
      setSignedIn(null);
      entries = [];
      listRoot.replaceChildren();
      setStatus('로그아웃했습니다.');
    } catch (error) {
      setStatus(`로그아웃하지 못했습니다: ${error.message}`, true);
    } finally {
      logoutButton.disabled = false;
    }
  });

  refreshButton.addEventListener('click', loadEntries);
  searchInput.addEventListener('input', renderEntries);

  client.auth.getSession().then(({ data, error }) => {
    if (error) {
      setStatus(`로그인 상태를 확인하지 못했습니다: ${error.message}`, true);
      return;
    }
    return applySession(data.session);
  }).catch((error) => {
    setStatus(`로그인 상태를 확인하지 못했습니다: ${error.message}`, true);
  });
});
