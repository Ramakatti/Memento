
// ============================================================
// MEMENTO TODO LIST - MAIN.JS
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("MAIN.JS LOADED");

    // ========================================================
    // SELECTORS
    // ========================================================

    const toDoInput = document.querySelector(".todo-input");
    const toDoBtn = document.querySelector(".todo-btn");
    const toDoList = document.querySelector(".todo-list");

    const standardTheme =
        document.querySelector(".standard-theme");

    const lightTheme =
        document.querySelector(".light-theme");

    const darkerTheme =
        document.querySelector(".darker-theme");


    // ========================================================
    // TODO PARENT
    // ========================================================

    let TODO_PARENT = null;


    // ========================================================
    // THEME
    // ========================================================

    let savedTheme =
        localStorage.getItem("savedTheme");

    if (!savedTheme) {
        savedTheme = "standard";
    }

    changeTheme(savedTheme);


    // ========================================================
    // EVENT LISTENERS
    // ========================================================

    if (toDoBtn) {

        toDoBtn.addEventListener(
            "click",
            addToDo
        );

    }


    if (toDoList) {

        toDoList.addEventListener(
            "click",
            deleteCheck
        );

    }


    if (standardTheme) {

        standardTheme.addEventListener(
            "click",
            function () {
                changeTheme("standard");
            }
        );

    }


    if (lightTheme) {

        lightTheme.addEventListener(
            "click",
            function () {
                changeTheme("light");
            }
        );

    }


    if (darkerTheme) {

        darkerTheme.addEventListener(
            "click",
            function () {
                changeTheme("darker");
            }
        );

    }


    // ========================================================
    // INITIAL LOAD
    // ========================================================

    loadTodosFromFrappe();


    // ========================================================
    // CSRF TOKEN
    // ========================================================

    function getCSRFToken() {

        // --------------------------------------------
        // 1. Frappe injected variable
        // --------------------------------------------

        if (
            window.csrf_token &&
            window.csrf_token !== "None"
        ) {

            return window.csrf_token;

        }


        // --------------------------------------------
        // 2. Meta tag
        // --------------------------------------------

        const metaToken =
            document.querySelector(
                'meta[name="csrf-token"]'
            );


        if (
            metaToken &&
            metaToken.content &&
            metaToken.content !== "None"
        ) {

            return metaToken.content;

        }


        // --------------------------------------------
        // 3. Cookie
        // --------------------------------------------

        const cookieToken =
            getCookie("csrf_token");


        if (cookieToken) {

            return cookieToken;

        }


        return null;
    }


    // ========================================================
    // COOKIE
    // ========================================================

    function getCookie(name) {

        const cookies =
            document.cookie.split(";");


        for (let cookie of cookies) {

            cookie =
                cookie.trim();


            if (
                cookie.startsWith(
                    name + "="
                )
            ) {

                return decodeURIComponent(
                    cookie.substring(
                        name.length + 1
                    )
                );

            }

        }


        return null;
    }


    // ========================================================
    // LOAD CURRENT USER'S TODO LIST
    // ========================================================

    async function loadTodosFromFrappe() {

        console.log(
            "LOADING TODO LIST FROM FRAPPE..."
        );


        try {

            // ==================================================
            // GET CURRENT USER'S TODO LIST
            // ==================================================

            const response =
                await fetch(
                    "/api/method/memento.api.get_my_todo_list",
                    {
                        method: "GET",
                        credentials: "same-origin"
                    }
                );


            const result =
                await response.json();


            console.log(
                "MY TODO LIST RESPONSE:",
                result
            );


            // ==================================================
            // CHECK RESPONSE
            // ==================================================

            if (
                !response.ok ||
                result.exc ||
                result.exception
            ) {

                throw new Error(
                    result.exception ||
                    result.message ||
                    "Failed to load user's To Do List"
                );

            }


            // ==================================================
            // GET MESSAGE
            // ==================================================

            const todoList =
                result.message;


            if (!todoList) {

                throw new Error(
                    "No To Do List returned from Frappe"
                );

            }


            // ==================================================
            // SAVE PARENT NAME
            // ==================================================

            TODO_PARENT =
                todoList.name;


            console.log(
                "CURRENT USER:",
                todoList.user
            );


            console.log(
                "CURRENT TODO LIST:",
                TODO_PARENT
            );


            // ==================================================
            // GET TASKS
            // ==================================================

            let tasks =
                todoList.tasks || [];


            // ==================================================
            // SORT TASKS
            //
            // RULE:
            // 1. Pending tasks first
            // 2. Newest pending task at the top
            // 3. Completed tasks at the bottom
            // 4. Newest completed task first
            //
            // Frappe child-table "idx" is used as the
            // task ordering value.
            // ==================================================

            tasks.sort(function (a, b) {

                const aCompleted =
                    String(a.status).toLowerCase() ===
                    "completed";

                const bCompleted =
                    String(b.status).toLowerCase() ===
                    "completed";


                // --------------------------------------------
                // Pending tasks always come before completed
                // --------------------------------------------

                if (aCompleted !== bCompleted) {

                    return aCompleted ? 1 : -1;

                }


                // --------------------------------------------
                // Same status:
                // newest idx first
                // --------------------------------------------

                return (
                    Number(b.idx || 0) -
                    Number(a.idx || 0)
                );

            });


            console.log(
                "SORTED TASKS FROM FRAPPE:",
                tasks
            );


            // ==================================================
            // CLEAR WEBSITE LIST
            // ==================================================

            if (toDoList) {

                toDoList.innerHTML = "";

            }


            // ==================================================
            // CREATE TASKS
            // ==================================================

            tasks.forEach(function (task) {

                createTodoElement(
                    task.task,
                    task.status,
                    task.name,
                    TODO_PARENT
                );

            });


            console.log(
                "TODO LIST LOADED SUCCESSFULLY"
            );

        }
        catch (error) {

            console.error(
                "Error loading tasks:",
                error
            );

        }

    }


    // ========================================================
    // ADD TODO
    // ========================================================

    async function addToDo(event) {

        event.preventDefault();


        if (!toDoInput) {

            console.error(
                "Todo input not found"
            );

            return;

        }


        const taskText =
            toDoInput.value.trim();


        if (!taskText) {

            alert(
                "You must write something!"
            );

            return;

        }


        // ====================================================
        // MAKE SURE TODO PARENT EXISTS
        // ====================================================

        if (!TODO_PARENT) {

            console.log(
                "TODO_PARENT not ready. Loading To Do List..."
            );


            await loadTodosFromFrappe();


            if (!TODO_PARENT) {

                alert(
                    "Could not find your To Do List."
                );

                return;

            }

        }


        try {

            console.log(
                "SAVING TASK TO FRAPPE:",
                taskText
            );


            // ==================================================
            // GET CSRF TOKEN
            // ==================================================

            const csrfToken =
                getCSRFToken();


            console.log(
                "CSRF TOKEN:",
                csrfToken
            );


            if (!csrfToken) {

                throw new Error(
                    "CSRF token not found"
                );

            }


            // ==================================================
            // ADD TASK
            // ==================================================

            const response =
                await fetch(
                    "/api/method/memento.api.add_todo_task",
                    {
                        method: "POST",

                        credentials:
                            "same-origin",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "X-Frappe-CSRF-Token":
                                csrfToken

                        },

                        body:
                            JSON.stringify({

                                parent_name:
                                    TODO_PARENT,

                                task:
                                    taskText

                            })

                        }
                    );


            const result =
                await response.json();


            console.log(
                "ADD RESPONSE:",
                result
            );


            // ==================================================
            // CHECK RESPONSE
            // ==================================================

            if (
                !response.ok ||
                result.exc ||
                result.exception
            ) {

                throw new Error(
                    result.exception ||
                    result.message ||
                    "Failed to save task"
                );

            }


            console.log(
                "TASK SAVED SUCCESSFULLY"
            );


            // ==================================================
            // CLEAR INPUT
            // ==================================================

            toDoInput.value = "";


            // ==================================================
            // RELOAD FROM FRAPPE
            // ==================================================

            await loadTodosFromFrappe();

        }
        catch (error) {

            console.error(
                "Error saving task:",
                error
            );


            alert(
                "Could not save task to Frappe."
            );

        }

    }


    // ========================================================
    // CHECK / DELETE
    // ========================================================

    async function deleteCheck(event) {

        const clickedElement =
            event.target;


        // ====================================================
        // CHECK BUTTON
        // ====================================================

        const checkButton =
            clickedElement.closest(
                ".check-btn"
            );


        if (checkButton) {

            const todoDiv =
                checkButton.closest(
                    ".todo"
                );


            if (!todoDiv) {

                return;

            }


            const taskName =
                todoDiv.dataset.taskName;


            const parentName =
                todoDiv.dataset.parentName;


            console.log(
                "CHECK CLICKED:",
                {
                    taskName,
                    parentName
                }
            );


            // =================================================
            // VALIDATE IDENTIFIERS
            // =================================================

            if (
                !taskName ||
                !parentName
            ) {

                console.error(
                    "Missing task information:",
                    {
                        taskName,
                        parentName
                    }
                );

                return;

            }


            // =================================================
            // DETERMINE NEW STATUS
            // =================================================

            const currentlyCompleted =
                todoDiv.classList.contains(
                    "completed"
                );


            const newStatus =
                currentlyCompleted
                    ? "Pending"
                    : "Completed";


            console.log(
                "CURRENT STATUS:",
                currentlyCompleted
                    ? "Completed"
                    : "Pending"
            );


            console.log(
                "NEW STATUS:",
                newStatus
            );


            try {

                // =============================================
                // GET CSRF TOKEN
                // =============================================

                const csrfToken =
                    getCSRFToken();


                if (!csrfToken) {

                    throw new Error(
                        "CSRF token not found"
                    );

                }


                // =============================================
                // UPDATE STATUS IN FRAPPE
                // =============================================

                const response =
                    await fetch(
                        "/api/method/memento.api.update_todo_task_status",
                        {
                            method: "POST",

                            credentials:
                                "same-origin",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "X-Frappe-CSRF-Token":
                                    csrfToken

                            },

                            body:
                                JSON.stringify({

                                    parent_name:
                                        parentName,

                                    task_name:
                                        taskName,

                                    status:
                                        newStatus

                                })

                        }
                    );


                const result =
                    await response.json();


                console.log(
                    "STATUS UPDATE RESPONSE:",
                    result
                );


                // =============================================
                // CHECK RESPONSE
                // =============================================

                if (
                    !response.ok ||
                    result.exc ||
                    result.exception
                ) {

                    throw new Error(
                        result.exception ||
                        result.message ||
                        "Failed to update task"
                    );

                }


                // =============================================
                // RELOAD FROM FRAPPE
                // =============================================

                await loadTodosFromFrappe();


                console.log(
                    "STATUS SAVED:",
                    newStatus
                );

            }
            catch (error) {

                console.error(
                    "Error updating task:",
                    error
                );


                alert(
                    "Could not update task in Frappe."
                );

            }


            return;

        }


        // ====================================================
        // DELETE BUTTON
        // ====================================================

        const deleteButton =
            clickedElement.closest(
                ".delete-btn"
            );


        if (deleteButton) {

            const todoDiv =
                deleteButton.closest(
                    ".todo"
                );


            if (!todoDiv) {

                return;

            }


            const taskName =
                todoDiv.dataset.taskName;


            const parentName =
                todoDiv.dataset.parentName;


            console.log(
                "DELETE CLICKED:",
                {
                    taskName,
                    parentName
                }
            );


            // =================================================
            // VALIDATE IDENTIFIERS
            // =================================================

            if (
                !taskName ||
                !parentName
            ) {

                console.error(
                    "Missing task information:",
                    {
                        taskName,
                        parentName
                    }
                );

                return;

            }


            // =================================================
            // CONFIRM DELETE
            // =================================================

            const confirmDelete =
                confirm(
                    "Are you sure you want to delete this task?"
                );


            if (!confirmDelete) {

                return;

            }


            try {

                // =============================================
                // GET CSRF TOKEN
                // =============================================

                const csrfToken =
                    getCSRFToken();


                if (!csrfToken) {

                    throw new Error(
                        "CSRF token not found"
                    );

                }


                console.log(
                    "DELETING TASK:",
                    {
                        parentName,
                        taskName
                    }
                );


                // =============================================
                // DELETE FROM FRAPPE
                // =============================================

                const response =
                    await fetch(
                        "/api/method/memento.api.delete_todo_task",
                        {
                            method: "POST",

                            credentials:
                                "same-origin",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "X-Frappe-CSRF-Token":
                                    csrfToken

                            },

                            body:
                                JSON.stringify({

                                    parent_name:
                                        parentName,

                                    task_name:
                                        taskName

                                })

                        }
                    );


                const result =
                    await response.json();


                console.log(
                    "DELETE RESPONSE:",
                    result
                );


                // =============================================
                // CHECK RESPONSE
                // =============================================

                if (
                    !response.ok ||
                    result.exc ||
                    result.exception
                ) {

                    throw new Error(
                        result.exception ||
                        result.message ||
                        "Failed to delete task"
                    );

                }


                console.log(
                    "TASK DELETED SUCCESSFULLY"
                );


                // =============================================
                // RELOAD FROM FRAPPE
                // =============================================

                await loadTodosFromFrappe();

            }
            catch (error) {

                console.error(
                    "Error deleting task:",
                    error
                );


                alert(
                    "Could not delete task from Frappe."
                );

            }

        }

    }


    // ========================================================
    // CREATE TODO ELEMENT
    // ========================================================

    function createTodoElement(
        taskText,
        status,
        taskName,
        parentName
    ) {

        if (!toDoList) {

            console.error(
                "Todo list container not found"
            );

            return;

        }


        const todoDiv =
            document.createElement(
                "div"
            );


        // ====================================================
        // TODO CLASS
        // ====================================================

        todoDiv.classList.add(
            "todo",
            `${savedTheme}-todo`
        );


        // ====================================================
        // STORE FRAPPE IDENTIFIERS
        // ====================================================

        todoDiv.dataset.taskName =
            taskName;


        todoDiv.dataset.parentName =
            parentName;


        // ====================================================
        // TASK TEXT
        // ====================================================

        const todoItem =
            document.createElement(
                "li"
            );


        todoItem.innerText =
            taskText;


        todoItem.classList.add(
            "todo-item"
        );


        todoDiv.appendChild(
            todoItem
        );


        // ====================================================
        // CHECK BUTTON
        // ====================================================

        const checkButton =
            document.createElement(
                "button"
            );


        checkButton.type =
            "button";


        checkButton.classList.add(
            "check-btn",
            `${savedTheme}-button`
        );


        checkButton.innerHTML =
            '<i class="fas fa-check"></i>';


        todoDiv.appendChild(
            checkButton
        );


        // ====================================================
        // DELETE BUTTON
        // ====================================================

        const deleteButton =
            document.createElement(
                "button"
            );


        deleteButton.type =
            "button";


        deleteButton.classList.add(
            "delete-btn",
            `${savedTheme}-button`
        );


        deleteButton.innerHTML =
            '<i class="fas fa-trash"></i>';


        todoDiv.appendChild(
            deleteButton
        );


        // ====================================================
        // APPLY SAVED STATUS
        // ====================================================

        if (
            String(status).toLowerCase() ===
            "completed"
        ) {

            todoDiv.classList.add(
                "completed"
            );

        }


        // ====================================================
        // ADD TO WEBSITE
        // ====================================================

        toDoList.appendChild(
            todoDiv
        );

    }


    // ========================================================
    // CHANGE THEME
    // ========================================================

    function changeTheme(color) {

        savedTheme =
            color;


        localStorage.setItem(
            "savedTheme",
            color
        );


        // ====================================================
        // BODY
        // ====================================================

        document.body.className =
            color;


        // ====================================================
        // TITLE
        // ====================================================

        const title =
            document.getElementById(
                "title"
            );


        if (title) {

            if (
                color === "darker"
            ) {

                title.classList.add(
                    "darker-title"
                );

            }
            else {

                title.classList.remove(
                    "darker-title"
                );

            }

        }


        // ====================================================
        // INPUT
        // ====================================================

        const input =
            document.querySelector(
                ".todo-input"
            );


        if (input) {

            input.className =
                `todo-input ${color}-input`;

        }


        // ====================================================
        // TODO ITEMS
        // ====================================================

        document
            .querySelectorAll(".todo")
            .forEach(function (todo) {

                const completed =
                    todo.classList.contains(
                        "completed"
                    );


                todo.className =
                    completed
                        ? `todo ${color}-todo completed`
                        : `todo ${color}-todo`;

            });


        // ====================================================
        // BUTTONS
        // ====================================================

        document
            .querySelectorAll("button")
            .forEach(function (button) {

                if (
                    button.classList.contains(
                        "check-btn"
                    )
                ) {

                    button.className =
                        `check-btn ${color}-button`;

                }
                else if (
                    button.classList.contains(
                        "delete-btn"
                    )
                ) {

                    button.className =
                        `delete-btn ${color}-button`;

                }
                else if (
                    button.classList.contains(
                        "todo-btn"
                    )
                ) {

                    button.className =
                        `todo-btn ${color}-button`;

                }

            });

    }

});



tasks.sort(function (a, b) {

    const aCompleted =
        String(a.status).toLowerCase() === "completed";

    const bCompleted =
        String(b.status).toLowerCase() === "completed";

    if (aCompleted !== bCompleted) {
        return aCompleted ? 1 : -1;
    }

    return Number(b.idx || 0) - Number(a.idx || 0);
});

