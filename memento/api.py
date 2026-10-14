import frappe
from frappe.utils import now_datetime


# =========================================================
# THEME
# =========================================================

@frappe.whitelist()
def get_theme():
    standerd = frappe.db.get_single_value(
        "Memento Settings", "standerd"
    )
    light = frappe.db.get_single_value(
        "Memento Settings", "light"
    )
    darker = frappe.db.get_single_value(
        "Memento Settings", "darker"
    )

    theme = None

    if standerd:
        theme = "standerd"

    if light:
        theme = "light"

    if darker:
        theme = "darker"

    return theme


# =========================================================
# MAIN TO DO LIST
# =========================================================

@frappe.whitelist()
def get_my_todo_list():
    user = frappe.session.user

    if not user or user == "Guest":
        frappe.throw("You must be logged in")

    # Find the logged-in user's To Do List
    todo_name = frappe.db.get_value(
        "To Do List",
        {"user": user},
        "name"
    )

    # Create a To Do List if one does not exist
    if not todo_name:
        todo_list = frappe.get_doc({
            "doctype": "To Do List",
            "user": user
        })

        todo_list.insert()
        todo_name = todo_list.name

    todo_list = frappe.get_doc("To Do List", todo_name)

    return {
        "name": todo_list.name,
        "user": todo_list.user,
        "tasks": [
            {
                "name": row.name,
                "todo": row.task,
                "status": row.status,
                "user": row.user,
                "time": row.time,
                "idx": row.idx,
                "creation": row.creation
            }
            for row in todo_list.tasks
        ]
    }


# =========================================================
# ADD TO DO TASK
# =========================================================

@frappe.whitelist()
def add_todo_task(parent_name, task):
    if not parent_name:
        frappe.throw("To Do List is required")

    if not task:
        frappe.throw("Task is required")

    user = frappe.session.user

    if not user or user == "Guest":
        frappe.throw("You must be logged in")

    task = str(task).strip()

    if not task:
        frappe.throw("Task is required")

    todo_list = frappe.get_doc("To Do List", parent_name)

    # Ensure users can only modify their own To Do List
    if todo_list.user != user:
        frappe.throw("You can only manage your own To Do List")

    current_time = now_datetime()

    # Add the To Do using the actual child fieldname: task
    todo_list.append(
        "tasks",
        {
            "task": task,
            "status": "Pending",
            "user": user,
            "time": current_time
        }
    )

    todo_list.save()

    # Add an activity comment
    user_name = (
        frappe.db.get_value("User", user, "full_name")
        or user
    )

    formatted_time = current_time.strftime("%I:%M %p")

    todo_list.add_comment(
        "Comment",
        f"- {user_name} has created the task: "
        f"{task} at {formatted_time}"
    )

    return {
        "name": todo_list.name,
        "tasks": [
            {
                "name": row.name,
                "todo": row.task,
                "status": row.status,
                "user": row.user,
                "time": row.time,
                "idx": row.idx,
                "creation": row.creation
            }
            for row in todo_list.tasks
        ]
    }


# =========================================================
# UPDATE TO DO TASK STATUS
# =========================================================

@frappe.whitelist()
def update_todo_task_status(parent_name, task_name, status):
    if not parent_name:
        frappe.throw("To Do List is required")

    if not task_name:
        frappe.throw("Task name is required")

    if status not in ["Pending", "Completed"]:
        frappe.throw("Invalid task status")

    user = frappe.session.user

    if not user or user == "Guest":
        frappe.throw("You must be logged in")

    todo_list = frappe.get_doc("To Do List", parent_name)

    # Ensure users can only modify their own To Do List
    if todo_list.user != user:
        frappe.throw("You can only manage your own To Do List")

    task_found = False
    task_text = None
    current_time = now_datetime()

    # Find the selected To Do and update its information
    for row in todo_list.tasks:
        if row.name == task_name:
            task_text = row.task
            row.status = status
            row.user = user
            row.time = current_time
            task_found = True
            break

    if not task_found:
        frappe.throw("Task not found")

    todo_list.save()

    # Add an activity comment
    user_name = (
        frappe.db.get_value("User", user, "full_name")
        or user
    )

    formatted_time = current_time.strftime("%I:%M %p")

    if status == "Completed":
        comment_text = (
            f"- {user_name} has completed the task: "
            f"{task_text} at {formatted_time}"
        )
    else:
        comment_text = (
            f"- {user_name} has marked the task as pending: "
            f"{task_text} at {formatted_time}"
        )

    todo_list.add_comment("Comment", comment_text)

    return {
        "success": True,
        "parent_name": parent_name,
        "task_name": task_name,
        "status": status,
        "user": user,
        "time": current_time
    }


# =========================================================
# DELETE TO DO TASK
# =========================================================

@frappe.whitelist()
def delete_todo_task(parent_name, task_name):
    if not parent_name:
        frappe.throw("To Do List is required")

    if not task_name:
        frappe.throw("Task name is required")

    user = frappe.session.user

    if not user or user == "Guest":
        frappe.throw("You must be logged in")

    todo_list = frappe.get_doc("To Do List", parent_name)

    # Ensure users can only delete tasks from their own To Do List
    if todo_list.user != user:
        frappe.throw("You can only manage your own To Do List")

    original_count = len(todo_list.tasks)
    deleted_task = None

    for row in todo_list.tasks:
        if row.name == task_name:
            deleted_task = row.task
            break

    if deleted_task is None:
        frappe.throw("Task not found")

    # Remove only the selected To Do
    todo_list.tasks = [
        row
        for row in todo_list.tasks
        if row.name != task_name
    ]

    if len(todo_list.tasks) == original_count:
        frappe.throw("Task not found")

    todo_list.save()

    # Add an activity comment
    user_name = (
        frappe.db.get_value("User", user, "full_name")
        or user
    )

    current_time = now_datetime()
    formatted_time = current_time.strftime("%I:%M %p")

    todo_list.add_comment(
        "Comment",
        f"- {user_name} has deleted the task: "
        f"{deleted_task} at {formatted_time}"
    )

    return {
        "success": True,
        "parent_name": parent_name,
        "task_name": task_name
    }


# =========================================================
# PROJECTS
# =========================================================

@frappe.whitelist()
def get_projects():
    projects = frappe.get_all(
        "My Projects",
        fields=["name"]
    )

    return projects


# =========================================================
# PROJECT TASKS
# =========================================================

@frappe.whitelist()
def get_tasks(project):
    if not project:
        return []

    tasks = frappe.get_all(
        "Tasks",
        filters={"project": project},
        fields=["name", "task_name", "project"]
    )

    return tasks


# =========================================================
# GET TO DOS FOR A PROJECT TASK
# =========================================================

@frappe.whitelist()
def get_task_todos(task_name):
    if not task_name:
        return []

    task_doc = frappe.get_doc("Tasks", task_name)

    todos = []

    for row in task_doc.to_do_table:
        user = row.user or ""

        # Get the full name for the response
        user_name = ""

        if user:
            user_name = (
                frappe.db.get_value(
                    "User",
                    user,
                    "full_name"
                )
                or user
            )

        todos.append({
            "name": row.name,
            "todo": row.task,
            "status": row.status,
            "user": user,
            "user_name": user_name,
            "time": str(row.time) if row.time else "",
            "idx": row.idx
        })

    return todos


# =========================================================
# PROJECT TO DO ACTIVITY COMMENTS
# =========================================================

def add_todo_activity_comment(task_name, action, task_text):
    user = frappe.session.user

    if not user or user == "Guest":
        frappe.throw("You must be logged in")

    user_name = (
        frappe.db.get_value("User", user, "full_name")
        or user
    )

    current_time = now_datetime().strftime(
        "%d-%m-%Y %I:%M %p"
    )

    task_doc = frappe.get_doc("Tasks", task_name)

    comment_text = (
        f"{user_name} {action}: "
        f"{task_text} at {current_time}"
    )

    task_doc.add_comment(
        comment_type="Comment",
        text=comment_text
    )


# =========================================================
# ADD PROJECT TO DO
# =========================================================

@frappe.whitelist()
def add_task_todo(task_name, task_text):
    if not task_name:
        frappe.throw("Task is required")

    if not task_text or not task_text.strip():
        frappe.throw("To Do description is required")

    user = frappe.session.user

    if not user or user == "Guest":
        frappe.throw("You must be logged in")

    task_doc = frappe.get_doc("Tasks", task_name)

    task_doc.check_permission("write")

    task_text = task_text.strip()
    current_time = now_datetime()

    # Save To Do, Status, User and Time using child fieldname: task
    todo_row = task_doc.append(
        "to_do_table",
        {
            "task": task_text,
            "status": "Pending",
            "user": user,
            "time": current_time
        }
    )

    task_doc.save()

    add_todo_activity_comment(
        task_name,
        "has added the To Do",
        task_text
    )

    return {
        "success": True,
        "message": "To Do added successfully",
        "name": todo_row.name,
        "todo": todo_row.task,
        "status": todo_row.status,
        "user": todo_row.user,
        "time": str(todo_row.time) if todo_row.time else ""
    }


# =========================================================
# UPDATE PROJECT TO DO STATUS
# =========================================================

@frappe.whitelist()
def update_task_todo_status(task_name, todo_name):
    if not task_name or not todo_name:
        frappe.throw("Task and To Do are required")

    user = frappe.session.user

    if not user or user == "Guest":
        frappe.throw("You must be logged in")

    task_doc = frappe.get_doc("Tasks", task_name)

    task_doc.check_permission("write")

    todo_row = None

    for row in task_doc.to_do_table:
        if row.name == todo_name:
            todo_row = row
            break

    if not todo_row:
        frappe.throw("To Do not found")

    if todo_row.status == "Completed":
        todo_row.status = "Pending"
        action = "has marked the To Do as pending"
    else:
        todo_row.status = "Completed"
        action = "has completed the To Do"

    current_time = now_datetime()

    # Save the latest user and time
    todo_row.user = user
    todo_row.time = current_time

    todo_text = todo_row.task
    new_status = todo_row.status

    task_doc.save()

    add_todo_activity_comment(
        task_name,
        action,
        todo_text
    )

    return {
        "success": True,
        "status": new_status,
        "user": user,
        "time": str(current_time)
    }


# =========================================================
# DELETE PROJECT TO DO
# =========================================================

@frappe.whitelist()
def delete_task_todo(task_name, todo_name):
    if not task_name or not todo_name:
        frappe.throw("Task and To Do are required")

    user = frappe.session.user

    if not user or user == "Guest":
        frappe.throw("You must be logged in")

    task_doc = frappe.get_doc("Tasks", task_name)

    task_doc.check_permission("write")

    todo_row = None

    for row in task_doc.to_do_table:
        if row.name == todo_name:
            todo_row = row
            break

    if not todo_row:
        frappe.throw("To Do not found")

    deleted_text = todo_row.task

    # Remove only the selected To Do
    task_doc.set(
        "to_do_table",
        [
            row
            for row in task_doc.to_do_table
            if row.name != todo_name
        ]
    )

    task_doc.save()

    add_todo_activity_comment(
        task_name,
        "has deleted the To Do",
        deleted_text
    )

    return {
        "success": True,
        "message": "To Do deleted successfully"
    }