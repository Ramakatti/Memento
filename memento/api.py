
import frappe
from frappe.utils import now_datetime


# ============================================================
# GET THEME
# ============================================================

@frappe.whitelist()
def get_theme():

    standerd = frappe.db.get_single_value(
        "Memento Settings",
        "standerd"
    )

    light = frappe.db.get_single_value(
        "Memento Settings",
        "light"
    )

    darker = frappe.db.get_single_value(
        "Memento Settings",
        "darker"
    )

    theme = None

    if standerd:
        theme = "standerd"

    if light:
        theme = "light"

    if darker:
        theme = "darker"

    return theme


# ============================================================
# GET CURRENT USER'S TODO LIST
# ============================================================

@frappe.whitelist()
def get_my_todo_list():

    user = frappe.session.user

    if not user or user == "Guest":
        frappe.throw("You must be logged in")

    # Find To Do List belonging to current user
    todo_name = frappe.db.get_value(
        "To Do List",
        {"user": user},
        "name"
    )

    # If user doesn't have a list, create one
    if not todo_name:

        todo_list = frappe.get_doc({
            "doctype": "To Do List",
            "user": user
        })

        todo_list.insert()

        frappe.db.commit()

        todo_name = todo_list.name

    # Get complete document
    todo_list = frappe.get_doc(
        "To Do List",
        todo_name
    )

    return {
        "name": todo_list.name,
        "user": todo_list.user,
        "tasks": [
            {
                "name": row.name,
                "task": row.task,
                "status": row.status,
                "idx": row.idx,
                "creation": row.creation
            }
            for row in todo_list.tasks
        ]
    }


# ============================================================
# ADD TODO TASK
# ============================================================

@frappe.whitelist()
def add_todo_task(parent_name, task):

    if not parent_name:
        frappe.throw(
            "To Do List is required"
        )

    if not task:
        frappe.throw(
            "Task is required"
        )

    # Get parent To Do List
    todo_list = frappe.get_doc(
        "To Do List",
        parent_name
    )

    # Make sure task is stored as text
    task = str(task).strip()

    if not task:
        frappe.throw(
            "Task is required"
        )

    # ========================================================
    # ADD TASK
    # ========================================================

    todo_list.append(
        "tasks",
        {
            "task": task,
            "status": "Pending"
        }
    )

    todo_list.save()

    # ========================================================
    # GET CURRENT USER
    # ========================================================

    user = frappe.session.user

    user_name = frappe.db.get_value(
        "User",
        user,
        "full_name"
    ) or user

    # ========================================================
    # GET CURRENT TIME
    # ========================================================

    current_time = now_datetime().strftime(
        "%I:%M %p"
    )

    # ========================================================
    # ADD COMMENT
    # ========================================================

    todo_list.add_comment(
        "Comment",
        f"- {user_name} has created the task: "
        f"{task} at {current_time}"
    )

    frappe.db.commit()

    # ========================================================
    # RETURN UPDATED TODO LIST
    # ========================================================

    return {
        "name": todo_list.name,
        "tasks": [
            {
                "name": row.name,
                "task": row.task,
                "status": row.status,
                "idx": row.idx,
                "creation": row.creation
            }
            for row in todo_list.tasks
        ]
    }


# ============================================================
# UPDATE TODO TASK STATUS
# ============================================================

@frappe.whitelist()
def update_todo_task_status(
    parent_name,
    task_name,
    status
):

    if not parent_name:
        frappe.throw(
            "To Do List is required"
        )

    if not task_name:
        frappe.throw(
            "Task name is required"
        )

    if status not in [
        "Pending",
        "Completed"
    ]:
        frappe.throw(
            "Invalid task status"
        )

    # ========================================================
    # GET TODO LIST
    # ========================================================

    todo_list = frappe.get_doc(
        "To Do List",
        parent_name
    )

    task_found = False
    task_text = None

    # ========================================================
    # FIND TASK
    # ========================================================

    for row in todo_list.tasks:

        if row.name == task_name:

            task_text = row.task

            row.status = status

            task_found = True

            break

    if not task_found:

        frappe.throw(
            "Task not found"
        )

    # ========================================================
    # SAVE STATUS
    # ========================================================

    todo_list.save()

    # ========================================================
    # GET CURRENT USER
    # ========================================================

    user = frappe.session.user

    user_name = frappe.db.get_value(
        "User",
        user,
        "full_name"
    ) or user

    # ========================================================
    # GET CURRENT TIME
    # ========================================================

    current_time = now_datetime().strftime(
        "%I:%M %p"
    )

    # ========================================================
    # CREATE COMMENT
    # ========================================================

    if status == "Completed":

        comment_text = (
            f"- {user_name} has completed the task: "
            f"{task_text} at {current_time}"
        )

    else:

        comment_text = (
            f"- {user_name} has marked the task as pending: "
            f"{task_text} at {current_time}"
        )

    # ========================================================
    # ADD COMMENT
    # ========================================================

    todo_list.add_comment(
        "Comment",
        comment_text
    )

    frappe.db.commit()

    # ========================================================
    # RETURN RESPONSE
    # ========================================================

    return {
        "success": True,
        "parent_name": parent_name,
        "task_name": task_name,
        "status": status
    }


# ============================================================
# DELETE TODO TASK
# ============================================================

@frappe.whitelist()
def delete_todo_task(
    parent_name,
    task_name
):

    if not parent_name:
        frappe.throw(
            "To Do List is required"
        )

    if not task_name:
        frappe.throw(
            "Task name is required"
        )

    # ========================================================
    # GET TODO LIST
    # ========================================================

    todo_list = frappe.get_doc(
        "To Do List",
        parent_name
    )

    original_count = len(
        todo_list.tasks
    )

    # ========================================================
    # FIND TASK BEFORE DELETING
    # ========================================================

    deleted_task = None

    for row in todo_list.tasks:

        if row.name == task_name:

            deleted_task = row.task

            break

    if deleted_task is None:

        frappe.throw(
            "Task not found"
        )

    # ========================================================
    # REMOVE TASK
    # ========================================================

    todo_list.tasks = [
        row
        for row in todo_list.tasks
        if row.name != task_name
    ]

    # ========================================================
    # VERIFY TASK WAS REMOVED
    # ========================================================

    if len(todo_list.tasks) == original_count:

        frappe.throw(
            "Task not found"
        )

    # ========================================================
    # SAVE TODO LIST
    # ========================================================

    todo_list.save()

    # ========================================================
    # GET CURRENT USER
    # ========================================================

    user = frappe.session.user

    user_name = frappe.db.get_value(
        "User",
        user,
        "full_name"
    ) or user

    # ========================================================
    # GET CURRENT TIME
    # ========================================================

    current_time = now_datetime().strftime(
        "%I:%M %p"
    )

    # ========================================================
    # ADD DELETE COMMENT
    # ========================================================

    todo_list.add_comment(
        "Comment",
        f"- {user_name} has deleted the task: "
        f"{deleted_task} at {current_time}"
    )

    frappe.db.commit()

    # ========================================================
    # RETURN RESPONSE
    # ========================================================

    return {
        "success": True,
        "parent_name": parent_name,
        "task_name": task_name
    }

