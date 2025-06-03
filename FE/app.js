// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8001/api';
const API_ENDPOINTS = {
    register: `${API_BASE_URL}/register/`,
    login: `${API_BASE_URL}/login/`,
    refreshToken: `${API_BASE_URL}/token/refresh/`,
    tasks: `${API_BASE_URL}/tasks/`
};

// State Management
let currentUser = null;
let accessToken = localStorage.getItem('accessToken');
let refreshToken = localStorage.getItem('refreshToken');
let tasks = [];
let currentTaskId = null;

// DOM Elements
const authForms = document.getElementById('authForms');
const taskManager = document.getElementById('taskManager');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const taskList = document.getElementById('taskList');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const logoutBtn = document.getElementById('logoutBtn');
const addTaskBtn = document.getElementById('addTaskBtn');
const closeModal = document.getElementById('closeModal');
const priorityFilter = document.getElementById('priorityFilter');
const statusFilter = document.getElementById('statusFilter');
const orderBy = document.getElementById('orderBy');

// Auth Tab Switching
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const formId = button.dataset.form;
        document.querySelectorAll('.auth-form').forEach(form => form.classList.add('hidden'));
        document.getElementById(formId).classList.remove('hidden');
    });
});

// API Helpers
async function apiRequest(endpoint, method = 'GET', data = null) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (accessToken && endpoint !== API_ENDPOINTS.login && endpoint !== API_ENDPOINTS.register) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
        console.log(`Making ${method} request to:`, endpoint);
        if (data) {
            console.log('Request data:', data);
        }

        const response = await fetch(endpoint, {
            method,
            headers,
            body: data ? JSON.stringify(data) : null
        });

        console.log('Response status:', response.status);

        if (response.status === 401 && refreshToken) {
            console.log('Token expired, attempting to refresh...');
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                return apiRequest(endpoint, method, data);
            }
        }

        // Handle DELETE requests or empty responses
        if (method === 'DELETE' && response.status === 204) {
            return null; // Return null for successful DELETE requests
        }

        // Only try to parse JSON if there's content
        if (response.status !== 204) {
            const responseText = await response.text();
            let result;
            try {
                result = responseText ? JSON.parse(responseText) : null;
            } catch (e) {
                console.error('Failed to parse response as JSON:', responseText);
                throw new Error('Invalid response from server');
            }

            if (!response.ok) {
                console.error('API Error:', result);
                throw new Error(result.detail || 'An error occurred');
            }

            return result;
        }

        return null; // Return null for other 204 responses
    } catch (error) {
        console.error('Request failed:', error);
        if (error.message === 'Failed to fetch') {
            throw new Error('Unable to connect to the server. Please make sure the backend is running and accessible.');
        }
        throw error;
    }
}

async function refreshAccessToken() {
    try {
        const response = await fetch(API_ENDPOINTS.refreshToken, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh: refreshToken })
        });

        if (response.ok) {
            const data = await response.json();
            accessToken = data.access;
            localStorage.setItem('accessToken', accessToken);
            return true;
        }
        
        return false;
    } catch (error) {
        logout();
        return false;
    }
}

// Auth Functions
async function login(username, password) {
    try {
        const data = await apiRequest(API_ENDPOINTS.login, 'POST', { username, password });
        accessToken = data.access;
        refreshToken = data.refresh;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        currentUser = username;
        showTaskManager();
    } catch (error) {
        document.getElementById('loginError').textContent = error.message;
    }
}

async function register(username, password) {
    try {
        await apiRequest(API_ENDPOINTS.register, 'POST', { username, password });
        await login(username, password);
    } catch (error) {
        document.getElementById('registerError').textContent = error.message;
    }
}

function logout() {
    accessToken = null;
    refreshToken = null;
    currentUser = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    showAuthForms();
}

// Task Functions
async function fetchTasks() {
    try {
        const queryParams = new URLSearchParams();
        
        if (priorityFilter.value) queryParams.append('priority', priorityFilter.value);
        if (statusFilter.value) queryParams.append('status', statusFilter.value);
        if (orderBy.value) queryParams.append('ordering', orderBy.value);
        
        const url = `${API_ENDPOINTS.tasks}?${queryParams.toString()}`;
        tasks = await apiRequest(url);
        renderTasks();
    } catch (error) {
        console.error('Error fetching tasks:', error);
        taskList.innerHTML = `<div class="error-message">Failed to load tasks. Please try again.</div>`;
    }
}

async function createTask(taskData) {
    try {
        await apiRequest(API_ENDPOINTS.tasks, 'POST', taskData);
        closeTaskModal();
        await fetchTasks(); // Refresh the task list
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = 'Task created successfully!';
        taskList.insertAdjacentElement('beforebegin', successMessage);
        setTimeout(() => successMessage.remove(), 3000); // Remove after 3 seconds
    } catch (error) {
        console.error('Error creating task:', error);
        alert('Failed to create task: ' + error.message);
    }
}

async function updateTask(taskId, taskData) {
    try {
        await apiRequest(`${API_ENDPOINTS.tasks}${taskId}/`, 'PATCH', taskData);
        closeTaskModal();
        await fetchTasks(); // Refresh the task list
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = 'Task updated successfully!';
        taskList.insertAdjacentElement('beforebegin', successMessage);
        setTimeout(() => successMessage.remove(), 3000); // Remove after 3 seconds
    } catch (error) {
        console.error('Error updating task:', error);
        alert('Failed to update task: ' + error.message);
    }
}

async function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        try {
            const response = await apiRequest(`${API_ENDPOINTS.tasks}${taskId}/`, 'DELETE');
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.textContent = 'Task deleted successfully!';
            taskList.insertAdjacentElement('beforebegin', successMessage);
            setTimeout(() => successMessage.remove(), 3000); // Remove after 3 seconds
            
            // Wait a brief moment before refreshing to ensure the delete is processed
            setTimeout(async () => {
                await fetchTasks(); // Refresh the task list
            }, 300);
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Failed to delete task: ' + error.message);
        }
    }
}

// UI Functions
function showAuthForms() {
    authForms.classList.remove('hidden');
    taskManager.classList.add('hidden');
}

function showTaskManager() {
    authForms.classList.add('hidden');
    taskManager.classList.remove('hidden');
    fetchTasks();
}

function openTaskModal(taskId = null) {
    currentTaskId = taskId;
    const modalTitle = document.getElementById('modalTitle');
    
    if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        modalTitle.textContent = 'Edit Task';
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskStatus').value = task.status;
    } else {
        modalTitle.textContent = 'Add New Task';
        taskForm.reset();
    }
    
    taskModal.classList.remove('hidden');
}

function closeTaskModal() {
    taskModal.classList.add('hidden');
    currentTaskId = null;
    taskForm.reset();
}

function renderTasks() {
    taskList.innerHTML = tasks.map(task => `
        <div class="task-card priority-${task.priority}">
            <div class="task-header">
                <h3>${task.title}</h3>
                <div class="task-actions">
                    <button onclick="openTaskModal(${task.id})">Edit</button>
                    <button onclick="deleteTask(${task.id})">Delete</button>
                </div>
            </div>
            <p>${task.description}</p>
            <div class="task-footer">
                <span class="status-badge status-${task.status}">${task.status}</span>
                <span class="priority-badge">Priority: ${task.priority}</span>
            </div>
        </div>
    `).join('');
}

// Event Listeners
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    await login(username, password);
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    await register(username, password);
});

taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        priority: document.getElementById('taskPriority').value,
        status: document.getElementById('taskStatus').value
    };
    
    if (currentTaskId) {
        await updateTask(currentTaskId, taskData);
    } else {
        await createTask(taskData);
    }
});

logoutBtn.addEventListener('click', logout);
addTaskBtn.addEventListener('click', () => openTaskModal());
closeModal.addEventListener('click', closeTaskModal);

[priorityFilter, statusFilter, orderBy].forEach(filter => {
    filter.addEventListener('change', fetchTasks);
});

// Initial Setup
if (accessToken) {
    showTaskManager();
} else {
    showAuthForms();
} 