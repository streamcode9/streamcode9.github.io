// DOM Elements
const addForm = document.getElementById('addForm');
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const footer = document.getElementById('footer');
const taskCount = document.getElementById('taskCount');
const clearCompleted = document.getElementById('clearCompleted');

// State
let todos = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    render();
    registerServiceWorker();
});

// Register Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered:', registration.scope);
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    }
}

// Load todos from localStorage
function loadTodos() {
    const stored = localStorage.getItem('todos');
    if (stored) {
        try {
            todos = JSON.parse(stored);
        } catch (e) {
            todos = [];
        }
    }
}

// Save todos to localStorage
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Add new todo
function addTodo(text) {
    const todo = {
        id: generateId(),
        text: text.trim(),
        completed: false,
        createdAt: Date.now()
    };
    todos.unshift(todo);
    saveTodos();
    render();
}

// Toggle todo completion
function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        render();
    }
}

// Delete todo
function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    render();
}

// Clear completed todos
function clearCompletedTodos() {
    todos = todos.filter(t => !t.completed);
    saveTodos();
    render();
}

// Create todo element
function createTodoElement(todo) {
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.dataset.id = todo.id;

    const checkbox = document.createElement('div');
    checkbox.className = `todo-checkbox ${todo.completed ? 'checked' : ''}`;
    checkbox.addEventListener('click', () => toggleTodo(todo.id));

    const text = document.createElement('span');
    text.className = `todo-text ${todo.completed ? 'completed' : ''}`;
    text.textContent = todo.text;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

    li.appendChild(checkbox);
    li.appendChild(text);
    li.appendChild(deleteBtn);

    return li;
}

// Render the todo list
function render() {
    // Clear current list
    todoList.innerHTML = '';

    // Render todos
    todos.forEach(todo => {
        todoList.appendChild(createTodoElement(todo));
    });

    // Update empty state
    if (todos.length === 0) {
        emptyState.classList.add('visible');
        footer.classList.remove('visible');
    } else {
        emptyState.classList.remove('visible');
        footer.classList.add('visible');
    }

    // Update task count
    const activeTasks = todos.filter(t => !t.completed).length;
    const totalTasks = todos.length;
    taskCount.textContent = `${activeTasks} of ${totalTasks} task${totalTasks !== 1 ? 's' : ''} remaining`;

    // Update clear button state
    const hasCompleted = todos.some(t => t.completed);
    clearCompleted.disabled = !hasCompleted;
}

// Event listeners
addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (text) {
        addTodo(text);
        todoInput.value = '';
        todoInput.blur(); // Hide keyboard on mobile
    }
});

clearCompleted.addEventListener('click', () => {
    if (confirm('Clear all completed tasks?')) {
        clearCompletedTodos();
    }
});

// Prevent zoom on input focus (iOS)
todoInput.addEventListener('focus', () => {
    document.body.style.zoom = '1';
});

// Handle visibility change to save data
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        saveTodos();
    }
});
