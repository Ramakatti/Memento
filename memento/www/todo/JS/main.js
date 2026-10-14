/* ============================================================
   TITLE TYPING ANIMATION
============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    const titleText = document.getElementById("title-text");
    const titleString = "Just do it";

    let titleIndex = 0;

    function typeTitle() {

        if (titleText && titleIndex < titleString.length) {

            titleText.textContent =
                titleString.substring(0, titleIndex + 1);

            titleIndex++;

            setTimeout(typeTitle, 180);
        }
    }

    setTimeout(typeTitle, 500);
});


/* ============================================================
   DOM SELECTORS
============================================================ */

const todoForm = document.getElementById("todo-form");

const todoInput = document.querySelector(".todo-input");

const todoList = document.querySelector(".todo-list");

const projectSelect = document.getElementById("project-select");

const taskSelect = document.getElementById("task-select");

const themeSelectors = document.querySelectorAll(".theme-selector");

const datetimeElement = document.getElementById("datetime");


/* ============================================================
   STATE
============================================================ */

let currentTheme =
    localStorage.getItem("savedTheme") || "standard";

let selectedProject = "";

let selectedTask = "";

let currentTodos = [];


/* ============================================================
   CLOCK
============================================================ */

function updateTime() {

    if (!datetimeElement) {
        return;
    }

    const now = new Date();

    datetimeElement.textContent =
        now.toLocaleDateString(
            undefined,
            {
                weekday: "long",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
}

updateTime();

setInterval(updateTime, 1000);


/* ============================================================
   FRAPPE API HELPER
============================================================ */

async function frappeCall(method, args = {}) {

    const csrfToken =
        window.csrf_token ||
        document.querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content") ||
        "";

    const url = "/api/method/" + method;

    const response = await fetch(url, {

        method: "POST",

        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Frappe-CSRF-Token": csrfToken
        },

        credentials: "same-origin",

        body: JSON.stringify(args)
    });

    let data;

    try {

        data = await response.json();

    } catch (error) {

        console.error("Unable to parse server response:", error);

        throw new Error("The server returned an invalid response.");
    }

    if (!response.ok || data.exc || data.exception) {

        console.error("Frappe API error:", data);

        throw new Error(
            data.exception ||
            data._server_messages ||
            data.message ||
            "Frappe API request failed."
        );
    }

    if (data && data.message !== undefined) {

        return data.message;
    }

    throw new Error("Invalid Frappe response.");
}


/* ============================================================
   THEME SWITCHER
============================================================ */

function applyTheme(theme) {

    currentTheme = theme;

    localStorage.setItem("savedTheme", theme);

    document.body.className = theme;


    /* Apply theme to inputs */

    const inputs = document.querySelectorAll("input");

    inputs.forEach(function (input) {

        input.classList.remove(
            "standard-input",
            "light-input",
            "darker-input"
        );

        input.classList.add(`${theme}-input`);
    });


    /* Apply theme to buttons */

    const buttons = document.querySelectorAll("button");

    buttons.forEach(function (button) {

        button.classList.remove(
            "standard-button",
            "light-button",
            "darker-button"
        );

        button.classList.add(`${theme}-button`);
    });


    /* Apply theme to project selector */

    if (projectSelect) {

        projectSelect.classList.remove(
            "standard-select",
            "light-select",
            "darker-select"
        );

        projectSelect.classList.add(`${theme}-select`);
    }


    /* Apply theme to task selector */

    if (taskSelect) {

        taskSelect.classList.remove(
            "standard-select",
            "light-select",
            "darker-select"
        );

        taskSelect.classList.add(`${theme}-select`);
    }


    renderTodos();
}


/* ============================================================
   THEME EVENTS
============================================================ */

themeSelectors.forEach(function (selector) {

    selector.addEventListener("click", function () {

        if (selector.classList.contains("standard-theme")) {

            applyTheme("standard");
        }

        if (selector.classList.contains("light-theme")) {

            applyTheme("light");
        }

        if (selector.classList.contains("darker-theme")) {

            applyTheme("darker");
        }
    });
});


/* ============================================================
   LOAD PROJECTS
============================================================ */

async function loadProjects() {

    if (!projectSelect || !taskSelect) {
        console.error("Project or task selector was not found in HTML.");
        return;
    }

    projectSelect.innerHTML =
        '<option value="">Select Project</option>';

    taskSelect.innerHTML =
        '<option value="">Select Task</option>';

    taskSelect.disabled = true;

    try {

        console.log("Loading projects...");

        const response = await frappeCall(
            "memento.api.get_projects"
        );

        console.log("Projects received:", response);

        if (!Array.isArray(response)) {

            throw new Error("Projects response is not an array.");
        }

        response.forEach(function (project) {

            const option = document.createElement("option");

            option.value = project.name;

            option.textContent = project.name;

            projectSelect.appendChild(option);
        });

        console.log("Projects loaded successfully.");

    } catch (error) {

        console.error("Error loading projects:", error);

        alert("Unable to load projects. Check the browser console.");
    }
}


/* ============================================================
   LOAD TASKS FOR SELECTED PROJECT
============================================================ */

async function loadTasks(projectName) {

    if (!taskSelect) {
        return;
    }

    taskSelect.innerHTML =
        '<option value="">Select Task</option>';

    taskSelect.disabled = true;

    selectedTask = "";

    currentTodos = [];

    renderTodos();

    if (!projectName) {

        selectedProject = "";

        return;
    }

    selectedProject = projectName;

    try {

        console.log("Loading tasks for project:", projectName);

        const response = await frappeCall(
            "memento.api.get_tasks",
            {
                project: projectName
            }
        );

        console.log("Tasks received:", response);

        if (!Array.isArray(response)) {

            throw new Error("Tasks response is not an array.");
        }

        response.forEach(function (task) {

            const option = document.createElement("option");

            option.value = task.name;

            option.textContent = task.task_name || task.name;

            taskSelect.appendChild(option);
        });

        taskSelect.disabled = false;

        console.log("Tasks loaded successfully.");

    } catch (error) {

        console.error("Error loading tasks:", error);

        alert("Unable to load tasks. Check the browser console.");
    }
}


/* ============================================================
   PROJECT CHANGE
============================================================ */

if (projectSelect) {

    projectSelect.addEventListener("change", async function (event) {

        const projectName = event.target.value;

        selectedProject = projectName;

        selectedTask = "";

        currentTodos = [];

        renderTodos();

        await loadTasks(projectName);
    });
}


/* ============================================================
   TASK CHANGE
============================================================ */

if (taskSelect) {

    taskSelect.addEventListener("change", async function (event) {

        const taskName = event.target.value;

        selectedTask = taskName;

        currentTodos = [];

        renderTodos();

        if (!taskName) {
            return;
        }

        await loadTaskTodos(taskName);
    });
}


/* ============================================================
   LOAD TODOS FROM SELECTED TASK
============================================================ */

async function loadTaskTodos(taskName) {

    if (!taskName) {

        currentTodos = [];

        renderTodos();

        return;
    }

    try {

        console.log("Loading To Do items for:", taskName);

        const response = await frappeCall(
            "memento.api.get_task_todos",
            {
                task_name: taskName
            }
        );

        console.log("To Do items received:", response);

        currentTodos = Array.isArray(response)
            ? response
            : [];

        renderTodos();

    } catch (error) {

        console.error("Error loading To Do items:", error);

        alert("Unable to load To Do items. Check the browser console.");
    }
}


/* ============================================================
   ADD TODO
   Uses the custom backend API to save the To Do and add
   an activity comment to the Tasks document Timeline.
============================================================ */

async function addTodo(event) {

    event.preventDefault();

    if (!todoInput) {
        console.error("To Do input was not found.");
        return;
    }

    const value = todoInput.value.trim();

    if (!selectedProject) {

        alert("Please select a project first.");

        return;
    }

    if (!selectedTask) {

        alert("Please select a task first.");

        return;
    }

    if (!value) {
        return;
    }

    try {

        console.log("Adding To Do:", value);

        console.log("Selected Tasks document:", selectedTask);

        const response = await frappeCall(
            "memento.api.add_task_todo",
            {
                task_name: selectedTask,
                task_text: value
            }
        );

        console.log("Add To Do response:", response);

        todoInput.value = "";

        await loadTaskTodos(selectedTask);

        console.log("To Do added successfully.");

    } catch (error) {

        console.error("Error adding To Do:", error);

        alert("Unable to add To Do: " + error.message);
    }
}


/* ============================================================
   RENDER TODOS
============================================================ */

function renderTodos() {

    if (!todoList) {
        return;
    }

    todoList.innerHTML = "";

    if (!selectedProject || !selectedTask) {
        return;
    }

    currentTodos.forEach(function (todo) {

        const todoDiv = document.createElement("div");

        todoDiv.classList.add(
            "todo",
            `${currentTheme}-todo`
        );

        if (todo.status === "Completed") {

            todoDiv.classList.add("completed");
        }

        todoDiv.dataset.id = todo.name;


        /* TODO TEXT */

        const newTodo = document.createElement("li");

        newTodo.innerText = todo.todo;

        newTodo.classList.add("todo-item");

        todoDiv.appendChild(newTodo);


        /* STATUS BUTTON */

        const checkBtn = document.createElement("button");

        checkBtn.type = "button";

        checkBtn.classList.add(
            "check-btn",
            `${currentTheme}-button`
        );

        checkBtn.setAttribute(
            "aria-label",
            todo.status === "Completed"
                ? "Mark as pending"
                : "Mark as completed"
        );

        checkBtn.innerHTML =
            '<i class="fas fa-check"></i>';

        todoDiv.appendChild(checkBtn);


        /* DELETE BUTTON */

        const deleteBtn = document.createElement("button");

        deleteBtn.type = "button";

        deleteBtn.classList.add(
            "delete-btn",
            `${currentTheme}-button`
        );

        deleteBtn.setAttribute(
            "aria-label",
            "Delete To Do"
        );

        deleteBtn.innerHTML =
            '<i class="fas fa-trash"></i>';

        todoDiv.appendChild(deleteBtn);


        /* ADD TODO TO LIST */

        todoList.appendChild(todoDiv);
    });
}


/* ============================================================
   TODO CLICK EVENTS
============================================================ */

if (todoList) {

    todoList.addEventListener("click", async function (event) {

        const target = event.target;

        const todoDiv = target.closest(".todo");

        if (!todoDiv) {
            return;
        }

        const todoName = todoDiv.dataset.id;


        /* COMPLETE / PENDING */

        if (target.closest(".check-btn")) {

            await updateTodoStatus(todoName);

            return;
        }


        /* DELETE */

        if (target.closest(".delete-btn")) {

            await deleteTodo(todoName);
        }
    });
}


/* ============================================================
   UPDATE TODO STATUS
   Uses the custom backend API to update the status and
   add an activity comment to the Tasks document Timeline.
============================================================ */

async function updateTodoStatus(todoName) {

    if (!selectedTask) {

        alert("Please select a task first.");

        return;
    }

    try {

        console.log("Updating To Do:", todoName);

        const response = await frappeCall(
            "memento.api.update_task_todo_status",
            {
                task_name: selectedTask,
                todo_name: todoName
            }
        );

        console.log("Status update response:", response);

        await loadTaskTodos(selectedTask);

    } catch (error) {

        console.error("Error updating To Do:", error);

        alert("Unable to update To Do: " + error.message);
    }
}


/* ============================================================
   DELETE TODO
   Uses the custom backend API to delete the To Do and add
   an activity comment to the Tasks document Timeline.
============================================================ */

async function deleteTodo(todoName) {

    if (!selectedTask) {

        alert("Please select a task first.");

        return;
    }

    try {

        console.log("Deleting To Do:", todoName);

        const response = await frappeCall(
            "memento.api.delete_task_todo",
            {
                task_name: selectedTask,
                todo_name: todoName
            }
        );

        console.log("Delete response:", response);

        await loadTaskTodos(selectedTask);

    } catch (error) {

        console.error("Error deleting To Do:", error);

        alert("Unable to delete To Do: " + error.message);
    }
}


/* ============================================================
   FORM SUBMIT
============================================================ */

if (todoForm) {

    todoForm.addEventListener("submit", addTodo);
}


/* ============================================================
   INITIAL LOAD
============================================================ */

async function initialize() {

    applyTheme(currentTheme);

    await loadProjects();

    renderTodos();
}

initialize();