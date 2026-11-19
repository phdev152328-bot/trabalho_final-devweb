/* Organizaê — comportamento da aplicação.
   A lista é mantida em memória durante o uso e salva no localStorage após cada mudança. */
(() => {
  "use strict";

  const STORAGE_KEY = "organizae.tasks.v1";
  const elements = {
    form: document.querySelector("#task-form"),
    title: document.querySelector("#task-title"),
    subject: document.querySelector("#task-subject"),
    dueDate: document.querySelector("#task-date"),
    list: document.querySelector("#task-list"),
    empty: document.querySelector("#empty-state"),
    emptyTitle: document.querySelector("#empty-title"),
    emptyDescription: document.querySelector("#empty-description"),
    search: document.querySelector("#task-search"),
    filters: [...document.querySelectorAll(".filter-button")],
    totalCount: document.querySelector("#total-count"),
    pendingCount: document.querySelector("#pending-count"),
    doneCount: document.querySelector("#done-count"),
    allFilterCount: document.querySelector("#filter-all-count"),
    pendingFilterCount: document.querySelector("#filter-pending-count"),
    completedFilterCount: document.querySelector("#filter-completed-count"),
    progressCaption: document.querySelector("#progress-caption"),
    progressBar: document.querySelector("#progress-bar"),
    progressFill: document.querySelector("#progress-fill"),
    todayDate: document.querySelector("#today-date"),
    currentYear: document.querySelector("#current-year"),
    editDialog: document.querySelector("#edit-dialog"),
    editForm: document.querySelector("#edit-form"),
    editId: document.querySelector("#edit-id"),
    editTitle: document.querySelector("#edit-task-title"),
    editSubject: document.querySelector("#edit-task-subject"),
    editDueDate: document.querySelector("#edit-task-date"),
    toast: document.querySelector("#toast"),
    storageNote: document.querySelector(".storage-note")
  };

  let tasks = loadTasks();
  let activeFilter = "all";
  let toastTimer;
  let canStore = true;

  initializePage();
  render();
  bindEvents();

  function initializePage() {
    const today = new Date();
    elements.todayDate.textContent = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long", day: "numeric", month: "long"
    }).format(today);
    elements.currentYear.textContent = today.getFullYear();
    elements.dueDate.min = toDateInputValue(today);
    elements.editDueDate.min = toDateInputValue(today);
  }

  function loadTasks() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isValidTask);
    } catch (error) {
      canStore = false;
      return [];
    }
  }

  function isValidTask(task) {
    return task && typeof task.id === "string" && typeof task.title === "string"
      && typeof task.completed === "boolean";
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      canStore = true;
      elements.storageNote.innerHTML = "<span aria-hidden=\"true\">◉</span> Suas tarefas ficam salvas neste dispositivo.";
    } catch (error) {
      canStore = false;
      elements.storageNote.textContent = "O armazenamento do navegador está indisponível. Suas tarefas podem não ficar salvas.";
    }
  }

  function bindEvents() {
    elements.form.addEventListener("submit", addTask);
    elements.list.addEventListener("click", handleListClick);
    elements.list.addEventListener("change", handleListChange);
    elements.filters.forEach((button) => {
      button.addEventListener("click", () => setFilter(button.dataset.filter));
    });
    elements.search.addEventListener("input", render);
    elements.editForm.addEventListener("submit", saveEditedTask);
    document.querySelectorAll(".close-dialog").forEach((button) => {
      button.addEventListener("click", () => elements.editDialog.close());
    });
    elements.editDialog.addEventListener("click", (event) => {
      if (event.target === elements.editDialog) elements.editDialog.close();
    });
  }

  function addTask(event) {
    event.preventDefault();
    const title = elements.title.value.trim();
    if (!title) {
      elements.title.setCustomValidity("Digite o nome da tarefa.");
      elements.title.reportValidity();
      elements.title.addEventListener("input", () => elements.title.setCustomValidity(""), { once: true });
      return;
    }

    tasks.unshift({
      id: createId(),
      title,
      subject: elements.subject.value.trim(),
      dueDate: elements.dueDate.value,
      completed: false,
      createdAt: new Date().toISOString()
    });
    saveTasks();
    elements.form.reset();
    render();
    elements.title.focus();
    showToast("Tarefa adicionada.");
  }

  function handleListClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const item = button.closest("[data-task-id]");
    const task = tasks.find((entry) => entry.id === item?.dataset.taskId);
    if (!task) return;

    if (button.dataset.action === "edit") openEditor(task);
    if (button.dataset.action === "delete") deleteTask(task);
  }

  function handleListChange(event) {
    if (!event.target.matches("input[data-action='toggle']")) return;
    const item = event.target.closest("[data-task-id]");
    const task = tasks.find((entry) => entry.id === item?.dataset.taskId);
    if (!task) return;

    task.completed = event.target.checked;
    task.completedAt = task.completed ? new Date().toISOString() : "";
    saveTasks();
    render();
    showToast(task.completed ? "Tarefa concluída." : "Tarefa voltou para a lista.");
  }

  function openEditor(task) {
    elements.editId.value = task.id;
    elements.editTitle.value = task.title;
    elements.editSubject.value = task.subject || "";
    elements.editDueDate.value = task.dueDate || "";
    if (typeof elements.editDialog.showModal === "function") {
      elements.editDialog.showModal();
      elements.editTitle.focus();
    }
  }

  function saveEditedTask(event) {
    event.preventDefault();
    const task = tasks.find((entry) => entry.id === elements.editId.value);
    const title = elements.editTitle.value.trim();
    if (!task || !title) return;

    task.title = title;
    task.subject = elements.editSubject.value.trim();
    task.dueDate = elements.editDueDate.value;
    saveTasks();
    elements.editDialog.close();
    render();
    showToast("Alterações salvas.");
  }

  function deleteTask(task) {
    const confirmed = window.confirm(`Excluir a tarefa “${task.title}”?`);
    if (!confirmed) return;
    tasks = tasks.filter((entry) => entry.id !== task.id);
    saveTasks();
    render();
    showToast("Tarefa excluída.");
  }

  function setFilter(filter) {
    activeFilter = filter;
    elements.filters.forEach((button) => {
      const isActive = button.dataset.filter === filter;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    render();
  }

  function render() {
    renderCounters();
    const query = elements.search.value.trim().toLocaleLowerCase("pt-BR");
    const visibleTasks = tasks.filter((task) => {
      const matchesFilter = activeFilter === "all"
        || (activeFilter === "pending" && !task.completed)
        || (activeFilter === "completed" && task.completed);
      const haystack = `${task.title} ${task.subject || ""}`.toLocaleLowerCase("pt-BR");
      return matchesFilter && haystack.includes(query);
    });

    elements.list.replaceChildren(...visibleTasks.map(createTaskElement));
    elements.empty.classList.toggle("is-hidden", visibleTasks.length > 0);
    if (visibleTasks.length === 0) setEmptyMessage(query);
  }

  function renderCounters() {
    const total = tasks.length;
    const done = tasks.filter((task) => task.completed).length;
    const pending = total - done;
    const percentage = total === 0 ? 0 : Math.round((done / total) * 100);

    elements.totalCount.textContent = total;
    elements.pendingCount.textContent = pending;
    elements.doneCount.textContent = done;
    elements.allFilterCount.textContent = total;
    elements.pendingFilterCount.textContent = pending;
    elements.completedFilterCount.textContent = done;
    elements.progressFill.style.width = `${percentage}%`;
    elements.progressBar.setAttribute("aria-valuenow", String(percentage));
    elements.progressBar.setAttribute("aria-valuetext", `${percentage}% concluído`);
    elements.progressCaption.textContent = total === 0
      ? "Tudo começa com uma tarefa."
      : percentage === 100 ? "Você concluiu tudo. Muito bem!" : `${percentage}% do caminho concluído.`;
  }

  function createTaskElement(task) {
    const item = document.createElement("article");
    item.className = `task-item${task.completed ? " is-completed" : ""}`;
    item.dataset.taskId = task.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.completed;
    checkbox.dataset.action = "toggle";
    checkbox.setAttribute("aria-label", task.completed
      ? `Marcar “${task.title}” como não concluída`
      : `Marcar “${task.title}” como concluída`);

    const content = document.createElement("div");
    content.className = "task-content";
    const title = document.createElement("p");
    title.className = "task-title";
    title.textContent = task.title;
    content.append(title);

    const meta = document.createElement("div");
    meta.className = "task-meta";
    if (task.subject) {
      const subject = document.createElement("span");
      subject.className = "task-subject";
      subject.textContent = task.subject;
      meta.append(subject);
    }
    if (task.dueDate) {
      const deadline = document.createElement("span");
      deadline.className = "task-deadline";
      deadline.textContent = `Prazo: ${formatDate(task.dueDate)}`;
      if (!task.completed && isOverdue(task.dueDate)) deadline.classList.add("is-overdue");
      meta.append(deadline);
    }
    if (meta.childElementCount) content.append(meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    actions.append(
      createActionButton("edit", "Editar tarefa", "✎", "icon-button"),
      createActionButton("delete", "Excluir tarefa", "×", "icon-button delete-button")
    );
    item.append(checkbox, content, actions);
    return item;
  }

  function createActionButton(action, label, symbol, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.dataset.action = action;
    button.setAttribute("aria-label", label);
    button.textContent = symbol;
    return button;
  }

  function setEmptyMessage(query) {
    if (query) {
      elements.emptyTitle.textContent = "Nenhuma tarefa encontrada";
      elements.emptyDescription.textContent = "Tente buscar por outro termo ou ajuste os filtros.";
      return;
    }
    if (tasks.length === 0) {
      elements.emptyTitle.textContent = "Sua lista começa aqui";
      elements.emptyDescription.textContent = "Escreva uma tarefa acima e deixe o próximo passo mais claro.";
      return;
    }
    elements.emptyTitle.textContent = activeFilter === "completed" ? "Nada concluído por enquanto" : "Tudo em dia por aqui";
    elements.emptyDescription.textContent = activeFilter === "completed"
      ? "Quando concluir uma tarefa, ela aparecerá nesta lista."
      : "Não há tarefas pendentes neste filtro.";
  }

  function formatDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
      .format(new Date(year, month - 1, day));
  }

  function isOverdue(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    const due = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }

  function toDateInputValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2600);
  }
})();
