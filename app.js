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
