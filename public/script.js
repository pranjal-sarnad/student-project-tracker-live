
const form = document.querySelector('#project-form');
const nameInput = document.querySelector('#name');
const statusInput = document.querySelector('#status');
const projectList = document.querySelector('#project-list');
const emptyState = document.querySelector('#empty-state');
const saveButton = document.querySelector('#save-button');
const cancelButton = document.querySelector('#cancel-button');
const message = document.querySelector('#message');

// The API is the source of truth for all projects.
let projects = [];
let editingId = null;
let busy = false;

function showMessage(text) {
    message.textContent = text;
}

function resetForm() {
    form.reset();
    editingId = null;
    saveButton.textContent = 'Add project';
    cancelButton.hidden = true;
}

function setBusy(value) {
    busy = value;
    saveButton.disabled = busy;
    cancelButton.disabled = busy;

    projectList.querySelectorAll('button').forEach(button => {
        button.disabled = busy;
    });
}

async function readResponse(response) {
    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error(
            response.ok
                ? 'The server returned an unreadable response.'
                : `Request failed with HTTP ${response.status}.`
        );
    }

    if (!response.ok) {
        throw new Error(
            typeof data?.error === 'string'
                ? data.error
                : `Request failed with HTTP ${response.status}.`
        );
    }

    return data;
}

function showRequestError(error) {
    if (error instanceof TypeError) {
        showMessage(
            'Could not connect to the server. Check that the server is running and try again.'
        );
    } else {
        showMessage(error.message || 'Something went wrong. Please try again.');
    }
}

function renderProjects() {
    projectList.replaceChildren();

    projects.forEach(project => {
        const listItem = document.createElement('li');

        const projectName = document.createElement('h3');
        projectName.textContent = project.name;

        const projectStatus = document.createElement('p');
        projectStatus.textContent = `Status: ${project.status}`;

        const actions = document.createElement('div');
        actions.className = 'project-actions';

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.textContent = 'Edit';
        editButton.disabled = busy;

        editButton.addEventListener('click', () => {
            if (busy) return;

            editingId = project.id;
            nameInput.value = project.name;
            statusInput.value = project.status;
            saveButton.textContent = 'Save changes';
            cancelButton.hidden = false;
            showMessage('Editing project.');
            nameInput.focus();
        });

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete';
        deleteButton.disabled = busy;

        deleteButton.addEventListener('click', async () => {
            if (busy) return;

            const confirmed = window.confirm(
                `Are you sure you want to delete "${project.name}"?`
            );

            if (!confirmed) return;

            setBusy(true);
            showMessage('Deleting project...');

            try {
                await readResponse(await fetch(
                    `/api/projects/${encodeURIComponent(project.id)}`,
                    { method: 'DELETE' }
                ));

                if (editingId === project.id) {
                    resetForm();
                }

                await loadProjects();
                showMessage('Project deleted successfully.');
            } catch (error) {
                showRequestError(error);
            } finally {
                setBusy(false);
                renderProjects();
            }
        });

        actions.append(editButton, deleteButton);
        listItem.append(projectName, projectStatus, actions);
        projectList.appendChild(listItem);
    });

    // Only show the empty state after a successful API load.
    emptyState.hidden = projects.length > 0;
}

async function loadProjects() {
    const response = await fetch('/api/projects');
    const data = await readResponse(response);

    if (!Array.isArray(data)) {
        throw new Error('The server returned an invalid project list.');
    }

    const validProjects = data.every(project =>
        project !== null &&
        typeof project === 'object' &&
        Number.isSafeInteger(project.id) &&
        project.id > 0 &&
        typeof project.name === 'string' &&
        project.name.trim() !== '' &&
        typeof project.status === 'string'
    );

    if (!validProjects) {
        throw new Error('The server returned invalid project data.');
    }

    projects = data;

    // If the project being edited no longer exists, leave edit mode.
    if (
        editingId !== null &&
        !projects.some(project => project.id === editingId)
    ) {
        resetForm();
    }

    renderProjects();
}

form.addEventListener('submit', async event => {
    event.preventDefault();

    if (busy) return;

    const name = nameInput.value.trim();
    const status = statusInput.value;

    if (name === '') {
        nameInput.focus();
        showMessage('Please enter a project name.');
        return;
    }

    const isEditing = editingId !== null;
    const projectId = editingId;

    const projectData = { name, status };

    setBusy(true);
    showMessage(isEditing ? 'Saving changes...' : 'Saving project...');

    try {
        const response = await fetch(
            isEditing
                ? `/api/projects/${encodeURIComponent(projectId)}`
                : '/api/projects',
            {
                method: isEditing ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(projectData)
            }
        );

        await readResponse(response);

        // The mutation succeeded. Clear the form only now.
        resetForm();

        try {
            await loadProjects();
            showMessage(
                isEditing
                    ? 'Project updated successfully.'
                    : 'Project added successfully.'
            );
        } catch (error) {
            showMessage(
                `The change was saved, but the project list could not be refreshed. ${error.message}`
            );
        }

        nameInput.focus();
    } catch (error) {
        // Keep the entered values and Edit mode if the mutation failed.
        showRequestError(error);
    } finally {
        setBusy(false);
        renderProjects();
    }
});

cancelButton.addEventListener('click', () => {
    if (busy) return;

    resetForm();
    showMessage('Edit cancelled.');
    nameInput.focus();
});

// Load the API collection when the page opens.
async function startApp() {
    emptyState.hidden = true;
    showMessage('Loading projects...');

    try {
        await loadProjects();
        showMessage(
            projects.length === 0
                ? 'No projects found.'
                : 'Projects loaded successfully.'
        );
    } catch (error) {
        projects = [];
        projectList.replaceChildren();
        emptyState.hidden = true;
        showRequestError(error);
    }
}

startApp();
