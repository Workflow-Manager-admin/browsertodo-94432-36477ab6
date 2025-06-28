import './style.css';

/** ----- API CONFIG ----- **/
const API_BASE = 'http://localhost:3001/tasks'; // Update <backend_port> to 3001 (from running container setup)
const STORAGE_KEY = 'todo-tasks';

/** Utility: Show error or notification to the user. */
function showMessage(message, type = 'error') {
  // Remove previous
  document.querySelectorAll('.todo-message').forEach(e => e.remove());
  const app = document.querySelector('.todo-app') || document.body;
  const msg = document.createElement('div');
  msg.className = `todo-message ${type}`;
  msg.textContent = message;
  app.insertBefore(msg, app.firstChild);
  setTimeout(() => { msg.remove(); }, 2500);
}

/** Sync localStorage with backend data */
function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/** Load tasks from localStorage (fallback) */
function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

/** PUBLIC_INTERFACE
 * Generate the core HTML structure of the To-Do app
 */
function renderApp() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="todo-app">
      <header class="todo-header">
        <h1>To-Do</h1>
      </header>
      <main class="todo-main">
        <form id="task-form" autocomplete="off">
          <input id="task-input" class="todo-input" type="text" placeholder="Add a new task..." maxlength="80" autocomplete="off" />
          <button class="todo-btn-add" type="submit" title="Add task">+</button>
        </form>
        <ul id="task-list" class="todo-list"></ul>
        <div class="todo-filters">
          <button class="filter-btn" data-filter="all">All</button>
          <button class="filter-btn" data-filter="active">Active</button>
          <button class="filter-btn" data-filter="completed">Completed</button>
        </div>
      </main>
    </div>
  `;
}

/** PUBLIC_INTERFACE
 * Renders the task list according to the current filter.
 * @param {*} tasks 
 * @param {string} filter 
 */
function renderTaskList(tasks = [], filter) {
  const ul = document.getElementById('task-list');
  ul.innerHTML = '';

  let filtered = tasks;
  if (filter === 'active') {
    filtered = tasks.filter(task => !task.completed);
  } else if (filter === 'completed') {
    filtered = tasks.filter(task => task.completed);
  }
  if (!filtered.length) {
    ul.innerHTML = `<li class="empty-list">No tasks.</li>`;
    return;
  }
  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (task.completed ? ' completed' : '');
    li.setAttribute('data-id', task.id);

    // Checkbox
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'todo-checkbox';
    cb.checked = !!task.completed;
    cb.tabIndex = 0;
    cb.setAttribute('aria-label', 'Mark completed');
    cb.addEventListener('change', () => handleToggleTask(task.id, cb, task));

    // Label
    const label = document.createElement('span');
    label.className = 'todo-label';
    label.textContent = task.title;
    if (task.completed) label.title = 'Completed';

    // Delete button
    const del = document.createElement('button');
    del.className = 'todo-btn-delete';
    del.title = 'Delete task';
    del.innerHTML = '×';
    del.addEventListener('click', () => handleDeleteTask(task.id));

    li.appendChild(cb);
    li.appendChild(label);
    li.appendChild(del);
    ul.appendChild(li);
  });
}

/**
 * Retrieves current filter from UI.
 */
function getCurrentFilter() {
  return document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || 'all';
}

/**
 * HANDLERS FOR UI -> BACKEND API OPERATIONS
 */

async function fetchTasks(showNotice) {
  try {
    const resp = await fetch(API_BASE);
    if (!resp.ok) throw new Error(await resp.text());
    const tasks = await resp.json();
    saveTasks(tasks);
    renderTaskList(tasks, getCurrentFilter());
    if (showNotice) showMessage('Tasks loaded', 'info');
    return tasks;
  } catch (e) {
    renderTaskList(loadTasks(), getCurrentFilter());
    showMessage("Failed to load tasks: " + (e.message || 'Network error'));
    return loadTasks();
  }
}

async function handleAddTask(ev) {
  ev.preventDefault();
  const input = document.getElementById('task-input');
  const val = input.value.trim();
  if (!val) {
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 350);
    return;
  }
  try {
    const resp = await fetch(API_BASE, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: val })
    });
    if (!resp.ok) throw new Error(await resp.text());
    input.value = '';
    showMessage('Task added!', 'success');
    await fetchTasks();
  } catch (e) {
    showMessage('Error adding task: ' + (e.message || 'API error'));
  }
}

async function handleToggleTask(id, cb, origTask) {
  // optimistic UI, but revert on error
  try {
    const resp = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !origTask.completed })
    });
    if (!resp.ok) throw new Error(await resp.text());
    showMessage('Task updated!', 'success');
    await fetchTasks();
  } catch (e) {
    showMessage('Failed to update: ' + (e.message || 'API error'));
    cb.checked = origTask.completed; // revert checkbox
  }
}

async function handleDeleteTask(id) {
  if (!confirm("Delete this task?")) return;
  try {
    const resp = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!resp.ok) throw new Error(await resp.text());
    showMessage('Task deleted!', 'success');
    await fetchTasks();
  } catch (e) {
    showMessage('Failed to delete: ' + (e.message || 'API error'));
  }
}

async function handleFilterClick(ev) {
  if (!ev.target.classList.contains('filter-btn')) return;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  ev.target.classList.add('active');
  renderTaskList(loadTasks(), ev.target.getAttribute('data-filter'));
}

/** PUBLIC_INTERFACE
 * Initializes all event listeners for the To-Do app
 */
function initEventListeners() {
  document.getElementById('task-form').addEventListener('submit', handleAddTask);

  const filterBar = document.querySelector('.todo-filters');
  filterBar.addEventListener('click', handleFilterClick);

  // Make "All" filter default active
  filterBar.querySelector('[data-filter="all"]').classList.add('active');
}

/** PUBLIC_INTERFACE
 * On app load, fetch from backend and render.
 */
async function boot() {
  renderApp();
  initEventListeners();
  await fetchTasks();
}


// Style for error/success/info message pop-ups
const style = document.createElement('style');
style.innerHTML = `
.todo-message {
  position: relative;
  background: #1e293b;
  color: #f8fafc;
  border-left: 4px solid var(--color-accent);
  font-size: 1rem;
  padding: 0.9em 1.25em;
  margin: 0 0 1em 0;
  box-shadow: 0 2px 16px #0e161f44;
  border-radius: 7px;
  letter-spacing: 0.01em;
  z-index: 40;
  animation: popslide 0.35s cubic-bezier(.47,1.64,.41,.8);
}
.todo-message.error { border-color: #ef5350; background: #271c1c; color: #ffbdbd;}
.todo-message.success { border-color: #27cc81; background: #1d2b21; color: #bfffdc;}
.todo-message.info { border-color: #22d3ee; background: #152736; color: #d3f9ff;}
@keyframes popslide {
  0% { opacity:0; transform: translateY(-36px) scale(.85);}
  100% {opacity:1; transform: translateY(0) scale(1);}
}
`;
document.head.appendChild(style);

boot();
