const form = document.getElementById('project-form');
const nameInput = document.getElementById('project-name');
const statusInput = document.getElementById('project-status');
const list = document.getElementById('project-list');
const message = document.getElementById('message');
const formTitle = document.getElementById('form-title');
const submitButton = document.getElementById('submit-button');
const cancelButton = document.getElementById('cancel-button');
const refreshButton = document.getElementById('refresh-button');

let editingId = null;
let projects = [];

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error || `Request failed (${response.status})`
    );
  }

  return data;
}

function showMessage(text, type = '') {
  message.textContent = text;
  message.className = type;
}

function resetForm() {
  editingId = null;
  form.reset();
  statusInput.value = 'Planned';
  formTitle.textContent = 'Add a project';
  submitButton.textContent = 'Add project';
  cancelButton.hidden = true;
}

function statusClass(status) {
  if (status === 'Completed') return 'completed';
  if (status === 'In Progress') return 'in-progress';
  return 'planned';
}

function renderProjects() {
  list.replaceChildren();

  if (projects.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No projects yet. Add your first project above.';
    list.appendChild(empty);
    return;
  }

  for (const project of projects) {
    const card = document.createElement('article');
    card.className = 'project-card';

    const title = document.createElement('h3');
    title.textContent = project.name;

    const footer = document.createElement('div');
    footer.className = 'card-footer';

    const badge = document.createElement('span');
    badge.className = `status ${statusClass(project.status)}`;
    badge.textContent = project.status;

    const buttons = document.createElement('div');
    buttons.className = 'card-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'secondary';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => startEdit(project));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'danger';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => deleteProject(project));

    buttons.append(editButton, deleteButton);
    footer.append(badge, buttons);
    card.append(title, footer);
    list.appendChild(card);
  }
}

async function loadProjects() {
  list.textContent = 'Loading projects…';
  refreshButton.disabled = true;

  try {
    projects = await api('/api/projects');
    renderProjects();
  } catch (error) {
    list.replaceChildren();

    const errorText = document.createElement('p');
    errorText.className = 'empty';
    errorText.textContent = `Could not load projects: ${error.message}`;
    list.appendChild(errorText);
  } finally {
    refreshButton.disabled = false;
  }
}

function startEdit(project) {
  editingId = project.id;
  nameInput.value = project.name;
  statusInput.value = project.status;
  formTitle.textContent = 'Edit project';
  submitButton.textContent = 'Save changes';
  cancelButton.hidden = false;
  showMessage('Editing selected project.');
  nameInput.focus();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const status = statusInput.value;

  if (!name) {
    showMessage('Please enter a project name.', 'error');
    return;
  }

  submitButton.disabled = true;

  try {
    if (editingId === null) {
      await api('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name, status })
      });

      showMessage('Project added successfully.', 'success');
    } else {
      await api(`/api/projects/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify({ name, status })
      });

      showMessage('Project updated successfully.', 'success');
    }

    resetForm();
    await loadProjects();
  } catch (error) {
    showMessage(error.message, 'error');
  } finally {
    submitButton.disabled = false;
  }
});

async function deleteProject(project) {
  if (!confirm(`Delete "${project.name}"?`)) return;

  try {
    await api(`/api/projects/${project.id}`, {
      method: 'DELETE'
    });

    showMessage('Project deleted successfully.', 'success');

    if (editingId === project.id) {
      resetForm();
    }

    await loadProjects();
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

cancelButton.addEventListener('click', () => {
  resetForm();
  showMessage('');
});

refreshButton.addEventListener('click', loadProjects);

loadProjects();