// ---- 数据 ----
// tasks: [{ id, name, start: "HH:MM", end: "HH:MM", done: bool }]
let tasks = [];
let celebrateTimeout = null;

// ---- 日期 ----
function renderDate() {
  const now = new Date();
  const weekDays = ['日','一','二','三','四','五','六'];
  const el = document.getElementById('dateDisplay');
  el.textContent = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 · 星期${weekDays[now.getDay()]}`;
}

renderDate();

// ---- 渲染任务列表 ----
function renderTasks() {
  const list = document.getElementById('taskList');
  list.innerHTML = '';

  const now = currentMinutes();

  tasks.forEach(task => {
    const taskStart = parseTime(task.start);
    const taskEnd   = parseTime(task.end);
    const isActive  = !task.done && now >= taskStart && now < taskEnd;
    const isMissed  = !task.done && now >= taskEnd;

    const item = document.createElement('div');
    item.className = 'task-item' +
      (task.done   ? ' done'   : '') +
      (isActive    ? ' active' : '') +
      (isMissed    ? ' missed' : '');

    const remaining = isActive ? parseTime(task.end) - now : null;
    item.innerHTML = `
      <div class="task-time">
        <strong>${task.start}</strong>
        <span>– ${task.end}</span>
        ${isActive ? `<span class="task-countdown">还剩 ${remaining} 分钟</span>` : ''}
      </div>
      <div class="task-name">${escapeHtml(task.name)}</div>
      <button class="task-check" data-id="${task.id}" aria-label="完成">
        ${task.done ? '✓' : ''}
      </button>
    `;

    item.querySelector('.task-check').addEventListener('click', () => completeTask(task.id));
    item.querySelector('.task-name').addEventListener('click', () => openSheet(task.id));
    item.querySelector('.task-time').addEventListener('click', () => openSheet(task.id));
    list.appendChild(item);
  });
}

// ---- 工具函数 ----
function currentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function parseTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function completeTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  renderTasks(); // 立即更新列表，不等庆祝 timeout
  if (task.done) {
    triggerCelebrate();
  } else {
    tick();
  }
}

function triggerCelebrate() {
  // 庆祝状态持续 3 秒后恢复正常 tick
  clearTimeout(celebrateTimeout);
  setCharState('celebrate', '太棒了！！继续加油！✨');
  celebrateTimeout = setTimeout(() => {
    celebrateTimeout = null;
    tick();
  }, 3000);
}

// ---- 弹出面板 ----
const addBtn        = document.getElementById('addBtn');
const sheetOverlay  = document.getElementById('sheetOverlay');
const confirmBtn    = document.getElementById('confirmBtn');
const sheetTitle    = document.getElementById('sheetTitle');
const taskNameInput = document.getElementById('taskName');
const startInput    = document.getElementById('startTime');
const endInput      = document.getElementById('endTime');

let editingId = null; // null = 新增模式，数字 = 编辑模式

addBtn.addEventListener('click', () => openSheet(null));
sheetOverlay.addEventListener('click', (e) => {
  if (e.target === sheetOverlay) closeSheet();
});
confirmBtn.addEventListener('click', saveTask);

startInput.addEventListener('change', () => {
  const start = parseTime(startInput.value);
  const end   = parseTime(endInput.value);
  if (end <= start) {
    const newEnd = (start + 60) % (24 * 60);
    const nh = String(Math.floor(newEnd / 60)).padStart(2, '0');
    const nm = String(newEnd % 60).padStart(2, '0');
    endInput.value = nh + ':' + nm;
  }
});

endInput.addEventListener('change', () => {
  const start = parseTime(startInput.value);
  const end   = parseTime(endInput.value);
  if (start >= end) {
    const newStart = Math.max(0, end - 60);
    const nh = String(Math.floor(newStart / 60)).padStart(2, '0');
    const nm = String(newStart % 60).padStart(2, '0');
    startInput.value = nh + ':' + nm;
  }
});

function openSheet(taskId) {
  editingId = taskId;
  if (taskId !== null) {
    const task = tasks.find(t => t.id === taskId);
    sheetTitle.textContent = '✏️ 编辑时间块';
    confirmBtn.textContent = '确认修改';
    taskNameInput.value = task.name;
    startInput.value = task.start;
    endInput.value = task.end;
  } else {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const hNext = String((now.getHours() + 1) % 24).padStart(2, '0');
    sheetTitle.textContent = '＋ 新时间块';
    confirmBtn.textContent = '确认添加';
    taskNameInput.value = '';
    startInput.value = h + ':00';
    endInput.value = hNext + ':00';
  }
  sheetOverlay.style.display = 'flex';
  setTimeout(() => taskNameInput.focus(), 100);
}

function closeSheet() {
  sheetOverlay.style.display = 'none';
  editingId = null;
  taskNameInput.value = '';
  startInput.value = '09:00';
  endInput.value = '10:00';
}

function saveTask() {
  const name  = taskNameInput.value.trim();
  const start = startInput.value;
  const end   = endInput.value;

  if (!name) { taskNameInput.focus(); return; }
  if (!start || !end) return;
  if (parseTime(start) >= parseTime(end)) {
    endInput.focus();
    return;
  }

  if (editingId !== null) {
    const task = tasks.find(t => t.id === editingId);
    if (task) {
      task.name  = name;
      task.start = start;
      task.end   = end;
      tasks.sort((a, b) => parseTime(a.start) - parseTime(b.start));
    }
  } else {
    tasks.push({ id: Date.now(), name, start, end, done: false });
    tasks.sort((a, b) => parseTime(a.start) - parseTime(b.start));
  }

  closeSheet();
  tick();
}

// ---- 状态系统 ----
const STATE_CONFIGS = {
  sleep:      { img: 'assets/sleep.png',      bubble: '还没有计划呢，先打个盹～' },
  idle:       { img: 'assets/idle.png',        bubble: '' },
  focus:      { img: 'assets/focus.png',       bubble: '' },
  urge:       { img: 'assets/urge.png',        bubble: '' },
  disappoint: { img: 'assets/disappoint.png',  bubble: '' },
  celebrate:  { img: 'assets/celebrate.png',   bubble: '太棒了！！继续加油！✨' },
  allDone:    { img: 'assets/allDone.png',     bubble: '今天全完成了！我们为你骄傲！🏆' },
};

// 预加载所有状态图片，防止切换时空白
(function preload() {
  Object.values(STATE_CONFIGS).forEach(c => { new Image().src = c.img; });
})();

function setCharState(state, bubbleText) {
  const img     = document.getElementById('charImg');
  const wrapper = document.getElementById('charWrapper');
  const bubble  = document.getElementById('stateBubble');
  const config  = STATE_CONFIGS[state];

  img.src = config.img;
  wrapper.className = `char-wrapper state-${state}`;
  bubble.textContent = bubbleText || config.bubble;
}

function tick() {
  const now = currentMinutes();
  renderTasks();

  // 1. 庆祝期间不覆盖（优先保护庆祝动画）
  if (celebrateTimeout !== null) return;

  // 2. 全部完成
  if (tasks.length > 0 && tasks.every(t => t.done)) {
    setCharState('allDone');
    return;
  }

  // 3 & 4. 当前有进行中任务
  const activeTask = tasks.find(t => !t.done && now >= parseTime(t.start) && now < parseTime(t.end));
  if (activeTask) {
    const remaining = parseTime(activeTask.end) - now;
    if (remaining <= 5) {
      setCharState('urge', `还有 ${remaining} 分钟！快快快，收个尾！`);
    } else {
      setCharState('focus', `你在「${activeTask.name}」，我们盯着你呢！`);
    }
    return;
  }

  // 5. 最近一条已超时未完成
  const missedTask = tasks
    .filter(t => !t.done && now >= parseTime(t.end))
    .sort((a, b) => parseTime(b.end) - parseTime(a.end))[0];
  if (missedTask) {
    setCharState('disappoint', `诶…「${missedTask.name}」没完成，下次加油！`);
    return;
  }

  // 6. 任务间隙 / 第一个任务前
  const nextTask = tasks.find(t => !t.done && parseTime(t.start) > now);
  if (nextTask) {
    setCharState('idle', `下一个任务 ${nextTask.start} 开始，休息一下～`);
    return;
  }

  // 7. 没有任务 / 22:00 以后 / 所有任务已过
  setCharState('sleep');
}

// ---- 定时器启动 ----
tick();
setInterval(() => {
  const h = new Date().getHours();
  if (celebrateTimeout !== null) return;
  if (h >= 22 || h < 5) { setCharState('sleep'); return; }
  tick();
}, 30000);
