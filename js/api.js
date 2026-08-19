let saveTimeout = null;

// Загрузка логов тренировок текущего пользователя из облака
async function loadMyLogs() {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
      method: 'GET',
      headers: { 
        'X-Master-Key': JSONBIN_API_KEY,
        'X-Bin-Meta': 'false' 
      }
    });
    if (!res.ok) throw new Error('Ошибка сети');
    const data = await res.json();
    logs = data[myUserId] || {};
  } catch(e) {
    console.error('Ошибка загрузки из облака, берём из локального кэша:', e);
    try {
      const val = localStorage.getItem('logs:' + myUserId);
      logs = val ? JSON.parse(val) : {};
    } catch(err) { logs = {}; }
  }
}

// Сохранение логов с задержкой (debounce), чтобы не спамить запрос к API
function saveLogs() {
  try { localStorage.setItem('logs:' + myUserId, JSON.stringify(logs)); } catch(e){}

  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      const getRes = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
        headers: { 
          'X-Master-Key': JSONBIN_API_KEY,
          'X-Bin-Meta': 'false' 
        }
      });
      let allData = {};
      if (getRes.ok) {
        allData = await getRes.json();
      }

      allData[myUserId] = logs;

      await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': JSONBIN_API_KEY
        },
        body: JSON.stringify(allData)
      });
    } catch(e) {
      console.error('Ошибка сохранения в облако:', e);
    }
  }, 500);
}

// Автоматическое определение пользователя из Telegram WebApp
function resolveTelegramUser(){
  try{
    const tg = window.Telegram && window.Telegram.WebApp;
    const u = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
    if(u && u.id){
      let name = u.username ? u.username : sanitizeName((u.first_name||'') + (u.last_name ? ' '+u.last_name : ''));
      if(!name) name = 'user'+u.id;
      return { id: 'tg_'+u.id, name };
    }
  }catch(e){}
  return null;
}

// Работа с локальным профилем
async function loadProfile(){
  try{
    const val = localStorage.getItem('profile');
    if(val){
      const p = JSON.parse(val);
      if(p && p.id && p.name) return p;
    }
  }catch(e){}
  return null;
}

async function saveProfile(id, name){
  try{ localStorage.setItem('profile', JSON.stringify({id, name})); }catch(e){}
}

async function registerUser(id, name){
  try{
    let list = [];
    try{
      const val = localStorage.getItem('registry');
      if(val) list = JSON.parse(val);
    }catch(e){ list = []; }
    const existing = list.find(u=>u.id===id);
    if(existing){
      if(existing.name !== name){ existing.name = name; localStorage.setItem('registry', JSON.stringify(list)); }
    } else {
      list.push({id, name});
      localStorage.setItem('registry', JSON.stringify(list));
    }
  }catch(e){}
}

async function getRegistry(){
  try{
    const val = localStorage.getItem('registry');
    return val ? JSON.parse(val) : [];
  }catch(e){ return []; }
}

async function fetchUserLogs(id){
  if(lbCache[id]) return lbCache[id];
  try{
    const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_API_KEY, 'X-Bin-Meta': 'false' }
    });
    if(res.ok){
      const data = await res.json();
      lbCache[id] = data[id] || {};
      return lbCache[id];
    }
  }catch(e){}
  lbCache[id] = {};
  return {};
}
