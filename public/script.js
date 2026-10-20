
const themeToggle = document.querySelector('#theme-toggle');

const form = document.querySelector('#project-form');
const nameInput = document.querySelector('#name');
const statusInput = document.querySelector('#status');
const projectList = document.querySelector('#project-list');
const emptyState = document.querySelector('#empty-state');
const saveButton = document.querySelector('#save-button');
const cancelButton = document.querySelector('#cancel-button');
const message = document.querySelector('#message');

let projects = [];
let editingId = null;
let isBusy = false;

// ------------------------------
// Light and dark mode
// ------------------------------

function applyTheme(theme) {
    const isDark = theme === 'dark';

    document.body.dataset.theme = isDark ? 'dark' : 'light';

    themeToggle.textContent = isDark ? '☀' : '☾';

    themeToggle.setAttribute(
        'aria-label',
        isDark ? 'Switch to light mode' : 'Switch to dark mode'
    );

    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.title = isDark
        ? 'Switch to light mode'
        : 'Switch to dark mode';
}

let savedTheme = 'light';

try {
    savedTheme =
        localStorage.getItem('student-project-tracker-theme') || 'light';
} catch {
    // Keep light mode if browser storage is unavailable.
}

applyTheme(savedTheme === 'dark' ? 'dark' : 'light');

themeToggle.addEventListener('click', () => {
    const nextTheme =
        document.body.dataset.theme === 'dark' ? 'light' : 'dark';

    applyTheme(nextTheme);

    try {
        localStorage.setItem('student-project-tracker-theme', nextTheme);
    } catch {
        // The toggle still works if browser storage is unavailable.
    }
});

// ------------------------------
// Project tracker
// ------------------------------

function setMessage(text) {
    message.textContent = text;
}

function setBusy(busy) {
    isBusy = busy;
    saveButton.disabled = busy;
    cancelButton.disabled = busy;
    nameInput.disabled = busy;
    statusInput.disabled = busy;

    projectList.querySelectorAll('button').forEach((button) => {
        button.disabled = busy;
    });
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    const contentType = response.headers.get('content-type') || '';
    let data = null;

    if (contentType.includes('application/json')) {
        data = await response.json();
    }

    if (!response.ok) {
        throw new Error(
            data?.error || `Request failed (${response.status}).`
        );
    }

    return data;
}

function resetForm() {
    form.reset();
    editingId = null;
    saveButton.textContent = 'Add project';
    cancelButton.hidden = true;
}

function renderProjects() {
    projectList.replaceChildren();
    emptyState.hidden = projects.length > 0;

    projects.forEach((project) => {
        const item = document.createElement('li');

        const details = document.createElement('div');
        details.className = 'project-details';

        const projectName = document.createElement('strong');
        projectName.textContent = project.name;

        const projectStatus = document.createElement('span');
        projectStatus.textContent = `Status: ${project.status}`;

        details.append(projectName, projectStatus);

        const actions = document.createElement('div');
        actions.className = 'project-actions';

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => {
            startEditing(project);
        });

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-button';
        deleteButton.addEventListener('click', () => {
            deleteProject(project.id, project.name);
        });

        actions.append(editButton, deleteButton);
        item.append(details, actions);
        projectList.append(item);
    });

    if (isBusy) {
        projectList.querySelectorAll('button').forEach((button) => {
            button.disabled = true;
        });
    }
}

async function loadProjects() {
    try {
        setMessage('Loading projects...');

        const data = await apiRequest('/api/projects');

        projects = Array.isArray(data) ? data : data.projects;

        if (!Array.isArray(projects)) {
            projects = [];
        }

        renderProjects();
        setMessage('');
    } catch (error) {
        setMessage(`Could not load projects: ${error.message}`);
    }
}

function startEditing(project) {
    if (isBusy) return;

    editingId = project.id;
    nameInput.value = project.name;
    statusInput.value = project.status;

    saveButton.textContent = 'Save changes';
    cancelButton.hidden = false;

    setMessage('Editing project.');
    nameInput.focus();
}

cancelButton.addEventListener('click', () => {
    if (isBusy) return;

    resetForm();
    setMessage('');
});

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (isBusy) return;

    const name = nameInput.value.trim();
    const status = statusInput.value;

    if (!name) {
        setMessage('Please enter a project name.');
        nameInput.focus();
        return;
    }

    const isEditing = editingId !== null;
    const url = isEditing
        ? `/api/projects/${encodeURIComponent(editingId)}`
        : '/api/projects';

    const method = isEditing ? 'PUT' : 'POST';

    setBusy(true);
    setMessage(isEditing ? 'Saving changes...' : 'Adding project...');

    try {
        await apiRequest(url, {
            method,
            body: JSON.stringify({ name, status })
        });

        resetForm();
        await loadProjects();

        setMessage(isEditing ? 'Project updated.' : 'Project added.');
    } catch (error) {
        setMessage(`Could not save project: ${error.message}`);
    } finally {
        setBusy(false);
        renderProjects();
    }
});

async function deleteProject(id, name) {
    if (isBusy) return;

    const confirmed = window.confirm(
        `Are you sure you want to delete "${name}"?`
    );

    if (!confirmed) return;

    setBusy(true);
    setMessage('Deleting project...');

    try {
        await apiRequest(`/api/projects/${encodeURIComponent(id)}`, {
            method: 'DELETE'
        });

        if (editingId === id) {
            resetForm();
        }

        await loadProjects();
        setMessage('Project deleted.');
    } catch (error) {
        setMessage(`Could not delete project: ${error.message}`);
    } finally {
        setBusy(false);
        renderProjects();
    }
}

loadProjects();
