import './style.css';

/** ----- COLOR PALETTE AND STYLE CONSTS ----- **/

const STORAGE_KEY = 'todo-tasks';

/**
 * Get tasks from localStorage
 * @returns {Array}
 */
function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * Save tasks to localStorage
 * @param {*} tasks 
 */
function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * PUBLIC_INTERFACE
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

/**
 * PUBLIC_INTERFACE
 * Renders the task list according to the current filter.
 * @param {*} tasks 
 * @param {string} filter 
 */
function renderTaskList(tasks, filter) {
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
    cb.addEventListener('change', () => toggleTask(task.id));

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
    del.addEventListener('click', () => deleteTask(task.id));

    li.appendChild(cb);
    li.appendChild(label);
    li.appendChild(del);
    ul.appendChild(li);
  });
}

/**
 * PUBLIC_INTERFACE
 * Adds a new task from input value
 */
function addTask(ev) {
  ev.preventDefault();
  const input = document.getElementById('task-input');
  const val = input.value.trim();
  if (!val) {
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 350);
    return;
  }
  const tasks = loadTasks();
  const task = {
    id: Date.now().toString(),
    title: val,
    completed: false
  };
  tasks.push(task);
  saveTasks(tasks);
  input.value = '';
  renderTaskList(tasks, getCurrentFilter());
}

/**
 * PUBLIC_INTERFACE
 * Toggles completed state for a task
 * @param {string} id 
 */
function toggleTask(id) {
  const tasks = loadTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx !== -1) {
    tasks[idx].completed = !tasks[idx].completed;
    saveTasks(tasks);
    renderTaskList(tasks, getCurrentFilter());
  }
}

/**
 * PUBLIC_INTERFACE
 * Deletes a task by id
 * @param {string} id 
 */
function deleteTask(id) {
  let tasks = loadTasks();
  tasks = tasks.filter(t => t.id !== id);
  saveTasks(tasks);
  renderTaskList(tasks, getCurrentFilter());
}

/**
 * PUBLIC_INTERFACE
 * Returns currently active filter value.
 * Defaults to 'all'
 */
function getCurrentFilter() {
  return document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || 'all';
}

/**
 * PUBLIC_INTERFACE
 * Handles filter button clicks
 * @param {*} ev
 */
function handleFilterClick(ev) {
  if (!ev.target.classList.contains('filter-btn')) return;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  ev.target.classList.add('active');
  renderTaskList(loadTasks(), ev.target.getAttribute('data-filter'));
}

/**
 * PUBLIC_INTERFACE
 * Initializes all event listeners for the To-Do app
 */
function initEventListeners() {
  document.getElementById('task-form').addEventListener('submit', addTask);

  const filterBar = document.querySelector('.todo-filters');
  filterBar.addEventListener('click', handleFilterClick);

  // Make "All" filter default active
  filterBar.querySelector('[data-filter="all"]').classList.add('active');
}

function boot() {
  renderApp();
  initEventListeners();
  renderTaskList(loadTasks(), getCurrentFilter());
}

boot();
