try {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
  }
} catch (e) {}

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function dstr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function parseD(s) { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function today() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function sameDay(a, b) { return dstr(a) === dstr(b); }
function sanitizeName(n) { return (n || '').trim().replace(/\s+/g, ' ').slice(0, 20); }
function slug(s) { return (s || '').toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '_').slice(0, 24); }

let myUserId = null;
let myUsername = null;
let isTelegramUser = false;
let logs = {};
let viewDate = today();
let activeTab = 'body';
let restTimer = null;
let lbCache = {};

function getSession(dateKey) {
  const dow = parseD(dateKey).getDay();
  const prog = PROGRAM[dow];
  if (!logs[dateKey]) {
    logs[dateKey] = { dow, exercises: {} };
  }
  const sess = logs[dateKey];
  sess.dow = dow;
  prog.items.forEach(it => {
    if (!sess.exercises[it.id] || sess.exercises[it.id].targetSets !== it.sets) {
      sess.exercises[it.id] = sess.exercises[it.id] || {};
      const ex = sess.exercises[it.id];
      ex.targetSets = it.sets;
      ex.targetReps = it.reps;
      if (!ex.sets || ex.sets.length !== it.sets) {
        ex.sets = [];
        for (let i = 0; i < it.sets; i++) ex.sets.push({ reps: it.reps, done: false });
      }
    }
  });
  return sess;
}

function sessionCounts(sess, prog) {
  let total = 0, done = 0;
  prog.items.forEach(it => {
    const ex = sess.exercises[it.id];
    if (!ex) { total += it.sets; return; }
    total += ex.sets.length;
    done += ex.sets.filter(s => s.done).length;
  });
  return { total, done };
}

function renderWorkout() {
  const dateKey = dstr(viewDate);
  const dow = viewDate.getDay();
  const prog = PROGRAM[dow];

  const dayTitleEl = document.getElementById('dayTitle');
  const daySubtitleEl = document.getElementById('daySubtitle');
  const exerciseListEl = document.getElementById('exerciseList');

  if (dayTitleEl) dayTitleEl.textContent = prog.label + ' (' + viewDate.getDate() + ' ' + MONTHS[viewDate.getMonth()] + ')';
  if (daySubtitleEl) daySubtitleEl.textContent = prog.items.length ? 'Ключ 1: Тело — Физический модуль' : 'День восстановления и отдыха';

  if (!prog.items.length) {
    if (exerciseListEl) exerciseListEl.innerHTML = '<div style="padding:20px 0; text-align:center; color:var(--text-muted)">Сегодня по плану отдых. Восстанавливаем силы!</div>';
    return;
  }

  const sess = getSession(dateKey);
  let html = '';

  prog.items.forEach(it => {
    const ex = sess.exercises[it.id];
    html += `<div class="exercise-item" style="margin-bottom:16px; border-bottom:1px solid var(--card-border); padding-bottom:12px;" data-ex="${it.id}">
      <div style="display:flex; justify-between; align-items:center; margin-bottom:8px;">
        <span style="font-weight:600;">${it.name}</span>
        <span style="font-size:12px; color:var(--text-muted);">${it.sets}×${it.reps}</span>
      </div>
      <div style="display:grid; grid-template-columns:repeat(5,1fr); gap:6px;">`;

    ex.sets.forEach((s, i) => {
      const isDone = s.done;
      html += `<button class="set-btn" data-i="${i}" style="padding:8px; border-radius:8px; border:1px solid var(--card-border); background:${isDone ? 'var(--accent-gold)' : 'var(--card-bg)'}; color:${isDone ? 'var(--bg-color)' : 'var(--text-main)'}; font-weight:600;">
        ${i + 1}
      </button>`;
    });

    html += `</div></div>`;
  });

  if (exerciseListEl) exerciseListEl.innerHTML = html;
  bindWorkoutEvents();
}

function bindWorkoutEvents() {
  const dateKey = dstr(viewDate);
  document.querySelectorAll('.exercise-item').forEach(item => {
    const exId = item.dataset.ex;
    item.querySelectorAll('.set-btn').forEach(btn => {
      btn.onclick = () => {
        const i = +btn.dataset.i;
        const sess = logs[dateKey];
        const s = sess.exercises[exId].sets[i];
        s.done = !s.done;
        saveLogs();
        renderWorkout();
      };
    });
  });
}

function startRest(seconds) {
  if (restTimer) clearInterval(restTimer);
  let left = seconds;
  const timerEl = document.getElementById('timerDisplay');
  
  restTimer = setInterval(() => {
    left--;
    if (timerEl) timerEl.textContent = fmtTime(left);
    if (left <= 0) {
      clearInterval(restTimer);
      if (timerEl) timerEl.textContent = '00:00';
      try {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
      } catch (e) {}
    }
  }, 1000);
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return pad(m) + ':' + pad(r);
}

async function init() {
  const tgUser = resolveTelegramUser();
  if (tgUser) {
    isTelegramUser = true;
    myUserId = tgUser.id;
    myUsername = tgUser.name;
    await saveProfile(myUserId, myUsername);
    await registerUser(myUserId, myUsername);
  } else {
    const p = await loadProfile();
    if (p) {
      myUserId = p.id;
      myUsername = p.name;
    } else {
      myUserId = 'user_guest';
      myUsername = 'Гость';
    }
  }

  const profileEl = document.getElementById('userProfile');
  if (profileEl) profileEl.textContent = '@' + myUsername;

  await loadMyLogs();
  renderWorkout();

  const btnRest = document.getElementById('btnRest');
  if (btnRest) btnRest.onclick = () => startRest(120);

  const btnFinish = document.getElementById('btnFinish');
  if (btnFinish) {
    btnFinish.onclick = () => {
      const dateKey = dstr(viewDate);
      const dow = viewDate.getDay();
      const prog = PROGRAM[dow];
      const sess = getSession(dateKey);

      prog.items.forEach(it => {
        sess.exercises[it.id].sets.forEach(s => s.done = true);
      });
      saveLogs();
      renderWorkout();
    };
  }
}

init();
