const API_URL = "/api/tasks";
let currentFilter = "all";

const icons = {
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M9 7l1-3h4l1 3M6 7l1 14h10l1-14"/></svg>'
};

function formatTaskCount(count) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return `${count} завдання`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} завдання`;
    return `${count} завдань`;
}

function updateOverview(tasks) {
    const completed = tasks.filter(task => task.completed).length;
    const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

    document.getElementById("taskCounter").textContent = formatTaskCount(tasks.length);
    document.getElementById("completedCount").textContent = completed;
    document.getElementById("progressValue").textContent = `${percent}%`;
    document.getElementById("progressRing").style.setProperty("--progress", `${percent * 3.6}deg`);
}

async function loadTasks() {
    const response = await fetch(API_URL);
    const tasks = await response.json();
    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    let filteredTasks = tasks;
    if (currentFilter === "active") filteredTasks = tasks.filter(task => !task.completed);
    if (currentFilter === "completed") filteredTasks = tasks.filter(task => task.completed);

    const emptyMessages = {
        all: "Тут поки тихо. Додай перше завдання.",
        active: "Усе виконано. Можна трохи перепочити.",
        completed: "Виконаних завдань поки немає."
    };
    taskList.dataset.empty = emptyMessages[currentFilter];

    filteredTasks.forEach((task, index) => {
        const li = document.createElement("li");
        li.className = `task-item${task.completed ? " completed-item" : ""}`;
        li.style.animationDelay = `${index * 45}ms`;
        li.innerHTML = `
            <button class="task-check" onclick="toggleTask(${task.id})" aria-label="${task.completed ? "Повернути завдання" : "Виконати завдання"}">
                ${icons.check}
            </button>
            <span class="task-text">${escapeHtml(task.text)}</span>
            <div class="actions">
                <button class="btn-done" onclick="toggleTask(${task.id})" aria-label="${task.completed ? "Повернути завдання" : "Виконати завдання"}">${icons.check}</button>
                <button class="btn-delete" onclick="deleteTask(${task.id}, this)" aria-label="Видалити завдання">${icons.trash}</button>
            </div>
        `;
        taskList.appendChild(li);
    });

    updateOverview(tasks);
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

async function addTask() {
    const input = document.getElementById("taskInput");
    const text = input.value.trim();

    if (!text) {
        const composer = input.closest(".composer");
        composer.classList.remove("input-error");
        void composer.offsetWidth;
        composer.classList.add("input-error");
        input.focus();
        return;
    }

    await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
    });

    input.value = "";
    loadTasks();
}

async function toggleTask(id) {
    await fetch(`${API_URL}/${id}`, { method: "PUT" });
    loadTasks();
}

async function deleteTask(id, button) {
    const item = button?.closest(".task-item");
    item?.classList.add("is-removing");
    await new Promise(resolve => setTimeout(resolve, 220));
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    loadTasks();
}

function filterTasks(filter) {
    currentFilter = filter;
    document.querySelectorAll(".filters button").forEach(button => button.classList.remove("active"));
    document.getElementById(`filter-${filter}`)?.classList.add("active");
    loadTasks();
}

async function clearCompleted() {
    const response = await fetch(API_URL);
    const tasks = await response.json();
    const completed = tasks.filter(task => task.completed);
    await Promise.all(completed.map(task => fetch(`${API_URL}/${task.id}`, { method: "DELETE" })));
    loadTasks();
}

const dateLabel = new Intl.DateTimeFormat("uk-UA", {
    weekday: "long",
    day: "numeric",
    month: "long"
}).format(new Date());
document.getElementById("currentDate").textContent = dateLabel[0].toUpperCase() + dateLabel.slice(1);

loadTasks();
