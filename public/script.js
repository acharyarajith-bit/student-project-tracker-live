
const form = document.querySelector('#project-form');
const nameInput = document.querySelector('#name');
const statusInput = document.querySelector('#status');
const projectList = document.querySelector('#project-list');
const emptyState = document.querySelector('#empty-state');
const saveButton = document.querySelector('#save-button');
const cancelButton = document.querySelector('#cancel-button');
const formTitle = document.querySelector('#form-title');
const message = document.querySelector('#message');

let projects = [];
let editingId = null;
let busy = false;
let projectsLoaded = false;

function showMessage(text) {
    message.textContent = text;
}

function setBusy(value) {
    busy = value;
    saveButton.disabled = value;
    cancelButton.disabled = value;

    projectList.querySelectorAll('button').forEach(button => {
        button.disabled = value;
    });
}

function resetForm() {
    form.reset();
    editingId = null;
    saveButton.textContent = 'Add Project';
    cancelButton.hidden = true;
    formTitle.textContent = 'Add a Project';
}

async function apiRequest(url, options = {}) {
    let response;

    try {
        response = await fetch(url, options);
    } catch {
        throw new Error(
            'Could not connect to the server. Check that your server is running.'
        );
    }

    if (!response.ok) {
        let errorMessage = `Request failed (${response.status}).`;

        try {
            const data = await response.json();
            if (data.error) {
                errorMessage = data.error;
            }
        } catch {
            // Keep the default HTTP error message.
        }

        throw new Error(errorMessage);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

async function loadProjects() {
    showMessage('Loading projects...');

    try {
        const data = await apiRequest('/api/projects');

        if (!Array.isArray(data)) {
            throw new Error('The server returned an invalid project list.');
        }

        projects = data;
        projectsLoaded = true;
        renderProjects();

        showMessage(
            projects.length
                ? `Loaded ${projects.length} project(s).`
                : 'No projects added yet.'
        );

        return true;
    } catch (error) {
        showMessage(`Error loading projects: ${error.message}`);
        renderProjects();
        return false;
    }
}

function renderProjects() {
    projectList.replaceChildren();

    for (const project of projects) {
        const item = document.createElement('li');

        const heading = document.createElement('h3');
        heading.textContent = project.name;

        const status = document.createElement('p');
        status.textContent = `Status: ${project.status}`;

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
            formTitle.textContent = 'Edit Project';

            nameInput.focus();
            showMessage(`Editing "${project.name}".`);
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

            if (!confirmed || busy) return;

            await deleteProject(project);
        });

        item.append(heading, status, editButton, deleteButton);
        projectList.appendChild(item);
    }

    // Show an empty list only after a successful GET request.
    emptyState.hidden = !projectsLoaded || projects.length > 0;
}

async function deleteProject(project) {
    if (busy) return;

    setBusy(true);
    showMessage(`Deleting "${project.name}"...`);

    try {
        await apiRequest(
            `/api/projects/${encodeURIComponent(project.id)}`,
            { method: 'DELETE' }
        );

        // The server confirmed deletion.
        projects = projects.filter(
            item => String(item.id) !== String(project.id)
        );

        if (String(editingId) === String(project.id)) {
            resetForm();
        }

        renderProjects();

        // Reload the authoritative server collection.
        const loaded = await loadProjects();

        if (loaded) {
            showMessage(`"${project.name}" deleted successfully.`);
        } else {
            showMessage(
                `"${project.name}" was deleted, but the list could not be refreshed.`
            );
        }
    } catch (error) {
        showMessage(`Could not delete project: ${error.message}`);
    } finally {
        setBusy(false);
        renderProjects();
    }
}

form.addEventListener('submit', async event => {
    event.preventDefault();

    if (busy) return;

    const name = nameInput.value.trim();
    const status = statusInput.value;

    if (!name) {
        showMessage('Please enter a project name.');
        nameInput.focus();
        return;
    }

    if (name.length > 80) {
        showMessage('Project name must be 80 characters or fewer.');
        nameInput.focus();
        return;
    }

    if (!['Planned', 'In Progress', 'Completed'].includes(status)) {
        showMessage('Please select a valid project status.');
        return;
    }

    const wasEditing = editingId !== null;
    const currentId = editingId;

    setBusy(true);
    showMessage(wasEditing ? 'Saving changes...' : 'Adding project...');

    try {
        const url = wasEditing
            ? `/api/projects/${encodeURIComponent(currentId)}`
            : '/api/projects';

        await apiRequest(url, {
            method: wasEditing ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, status })
        });

        // The mutation succeeded, so it is safe to reset the form.
        resetForm();

        const loaded = await loadProjects();

        if (loaded) {
            showMessage(
                wasEditing
                    ? 'Project updated successfully.'
                    : 'Project added successfully.'
            );
        } else {
            showMessage(
                wasEditing
                    ? 'Project updated, but the list could not be refreshed.'
                    : 'Project added, but the list could not be refreshed.'
            );
        }
    } catch (error) {
        // Preserve the user's input after a failed save.
        showMessage(`Could not save project: ${error.message}`);
    } finally {
        setBusy(false);
        renderProjects();
    }
});

cancelButton.addEventListener('click', () => {
    if (busy) return;

    resetForm();
    showMessage('Edit cancelled.');
});

setBusy(true);

loadProjects().finally(() => {
    setBusy(false);
    renderProjects();
});
