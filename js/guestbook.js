document.addEventListener('DOMContentLoaded', () => {
  const listRoot = document.getElementById('guestbook-list');
  const form = document.getElementById('guestbook-form');
  const config = window.WEDDING_CONFIG;

  if (!listRoot || !form || !config) return;

  const supabaseConfig = config.supabase;
  const hasSupabaseConfig = Boolean(supabaseConfig?.url && supabaseConfig?.anonKey);
  const client = hasSupabaseConfig && window.supabase?.createClient
    ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)
    : null;
  const localStorageKey = 'wedding-guestbook-preview';
  let entries = (config.guestbook || []).slice().reverse();
  const submitButton = form.querySelector('button[type="submit"]');

  const loadLocalGuestbook = () => {
    const savedEntries = window.localStorage.getItem(localStorageKey);
    if (savedEntries === null) return entries;

    const parsedEntries = JSON.parse(savedEntries);
    const isValidEntry = (entry) => (
      entry
      && typeof entry.name === 'string'
      && typeof entry.message === 'string'
      && (typeof entry.created_at === 'string' || typeof entry.date === 'string')
    );
    if (!Array.isArray(parsedEntries) || !parsedEntries.every(isValidEntry)) {
      throw new Error('저장된 방명록 데이터 형식이 올바르지 않습니다.');
    }

    return parsedEntries;
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

  const renderGuestbook = (guestbookEntries) => {
    listRoot.replaceChildren();

    if (!guestbookEntries.length) {
      const emptyState = document.createElement('p');
      emptyState.className = 'guestbook-empty';
      emptyState.textContent = '첫 번째 축하 메시지를 남겨 주세요.';
      listRoot.append(emptyState);
      return;
    }

    guestbookEntries.forEach((entry) => {
      const item = document.createElement('article');
      item.className = 'guestbook-item';

      const heading = document.createElement('div');
      heading.className = 'guestbook-head';

      const name = document.createElement('span');
      name.className = 'guestbook-name';
      name.textContent = entry.name;

      const date = document.createElement('time');
      date.className = 'guestbook-date';
      date.dateTime = entry.created_at || entry.date;
      date.textContent = formatDate(entry.created_at || entry.date);

      const message = document.createElement('p');
      message.className = 'guestbook-message';
      message.textContent = entry.message;

      heading.append(name, date);
      if (client) {
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'guestbook-edit-button';
        editButton.textContent = '수정';
        editButton.setAttribute('aria-label', `${entry.name}님의 축하 메시지 수정`);
        editButton.addEventListener('click', () => editEntry(entry));
        item.append(heading, message, editButton);
      } else {
        item.append(heading, message);
      }

      listRoot.append(item);
    });
  };

  const editEntry = async (entry) => {
    const password = window.prompt('작성할 때 입력한 비밀번호를 입력해 주세요.');
    if (password === null) return;
    if (!/^[0-9]{4,6}$/.test(password)) {
      window.showToast?.('비밀번호는 4~6자리 숫자로 입력해 주세요.');
      return;
    }

    const message = window.prompt('수정할 메시지를 입력해 주세요.', entry.message);
    if (message === null) return;
    const updatedMessage = message.trim();
    if (!updatedMessage || updatedMessage.length > 200) {
      window.showToast?.('메시지는 1자 이상 200자 이하여야 합니다.');
      return;
    }

    try {
      const { data, error } = await client.rpc('guestbook_update', {
        p_id: entry.id,
        p_password: password,
        p_message: updatedMessage
      });
      if (error) throw error;
      if (!data) throw new Error('비밀번호가 틀렸거나 수정할 수 없는 메시지입니다.');

      window.showToast?.('축하 메시지를 수정했습니다.');
      await loadGuestbook();
    } catch (error) {
      window.showToast?.(`수정하지 못했습니다: ${error.message}`);
    }
  };

  const loadGuestbook = async () => {
    listRoot.textContent = '축하 메시지를 불러오는 중입니다.';
    try {
      const { data, error } = await client
        .from('guestbook')
        .select('id, name, message, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      entries = data;
      renderGuestbook(entries);
    } catch (error) {
      listRoot.textContent = `축하 메시지를 불러오지 못했습니다: ${error.message}`;
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const nameInput = document.getElementById('guest-name');
    const messageInput = document.getElementById('guest-message');
    const passwordInput = document.getElementById('guest-password');
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();
    const password = passwordInput.value.trim();

    if (!name || name.length > 20 || !message || message.length > 200 || !/^[0-9]{4,6}$/.test(password)) {
      window.showToast?.('이름, 메시지, 비밀번호(4~6자리 숫자)를 확인해 주세요.');
      return;
    }

    if (hasSupabaseConfig && !client) {
      window.showToast?.('방명록 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    submitButton.disabled = true;
    try {
      if (client) {
        const { error } = await client.rpc('guestbook_create', {
          p_name: name,
          p_message: message,
          p_password: password
        });
        if (error) throw error;
        form.reset();
        window.showToast?.('축하 메시지가 등록되었습니다.');
        await loadGuestbook();
        return;
      }

      const nextEntries = [{ name, message, date: new Date().toISOString() }, ...entries];
      window.localStorage.setItem(localStorageKey, JSON.stringify(nextEntries));
      entries = nextEntries;
      renderGuestbook(entries);
      form.reset();
      window.showToast?.('현재 브라우저에 축하 메시지를 저장했습니다. (다른 기기와 공유되지 않습니다)');
    } catch (error) {
      window.showToast?.(`등록하지 못했습니다: ${error.message}`);
    } finally {
      submitButton.disabled = false;
    }
  });

  if (client) {
    loadGuestbook();
  } else if (hasSupabaseConfig) {
    listRoot.textContent = '방명록 서비스에 연결할 수 없습니다. 네트워크 연결을 확인해 주세요.';
  } else {
    try {
      entries = loadLocalGuestbook();
      renderGuestbook(entries);
    } catch (error) {
      listRoot.textContent = `브라우저에 저장된 방명록을 불러오지 못했습니다: ${error.message}`;
      submitButton.disabled = true;
    }
  }
});
