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

    item.innerHTML = `
      <div class="task-time">
        <strong>${task.start}</strong>${task.end}
      </div>
      <div class="task-name">${escapeHtml(task.name)}</div>
      <button class="task-check" data-id="${task.id}" aria-label="完成">
        ${task.done ? '✓' : ''}
      </button>
    `;

    item.querySelector('.task-check').addEventListener('click', () => completeTask(task.id));
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
  if (!task || task.done) return;
  task.done = true;
  triggerCelebrate();
  tick();
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
const addBtn       = document.getElementById('addBtn');
const sheetOverlay = document.getElementById('sheetOverlay');
const confirmBtn   = document.getElementById('confirmBtn');
const taskNameInput = document.getElementById('taskName');
const startInput   = document.getElementById('startTime');
const endInput     = document.getElementById('endTime');

addBtn.addEventListener('click', openSheet);
sheetOverlay.addEventListener('click', (e) => {
  if (e.target === sheetOverlay) closeSheet();
});
confirmBtn.addEventListener('click', addTask);

function openSheet() {
  sheetOverlay.style.display = 'flex';
  setTimeout(() => taskNameInput.focus(), 100);
}

function closeSheet() {
  sheetOverlay.style.display = 'none';
  taskNameInput.value = '';
}

function addTask() {
  const name  = taskNameInput.value.trim();
  const start = startInput.value;
  const end   = endInput.value;

  if (!name) { taskNameInput.focus(); return; }
  if (!start || !end) return;
  if (parseTime(start) >= parseTime(end)) {
    endInput.focus();
    return;
  }

  tasks.push({ id: Date.now(), name, start, end, done: false });
  tasks.sort((a, b) => parseTime(a.start) - parseTime(b.start));

  closeSheet();
  tick();
}
