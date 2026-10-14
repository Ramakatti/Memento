
import frappe
import json


@frappe.whitelist()
def new_project(user,newproject):
    newproject = frappe.parse_json(newproject)
    # frappe.msgprint(str(newproject.get("status").capitalize()))
    doc = frappe.new_doc('Projects')
    doc.project_name = newproject.get('title')
    doc.category = newproject.get('category').capitalize()
    doc.start_date = newproject.get('startTime')
    doc.end_date = newproject.get('endTime')
    doc.status = newproject.get('status').capitalize()
    doc.priority_level = newproject.get('priority').capitalize()
    doc.description = newproject.get('description')
    doc.user = user
    doc.insert()
    return {"status":"Success"}

@frappe.whitelist()
def new_task(new_task):
    new_task = frappe.parse_json(new_task)
    # frappe.msgprint(str(new_task.get("status").capitalize()))
    doc = frappe.new_doc('Tasks')
    doc.task_name = new_task.get('task_name')
    doc.project = new_task.get('project')
    doc.from_date = new_task.get('expected_start_date')
    doc.to_date = new_task.get('expected_end_date')
    doc.status = new_task.get('status').capitalize()
    doc.priority_level = new_task.get('priority').capitalize()
    doc.description = new_task.get('description')
    doc.created_by = frappe.session.user
    # doc.insert()
    return doc.insert()

@frappe.whitelist()
def delete_project(project_id):
    # frappe.msgprint(str(project_id))
    print("projectID :",project_id)
    frappe.db.delete("Projects", project_id)
    # doc = frappe.get_doc('Projects', project_id)
    # doc.delete()
    return {"status":"Success","project_id":project_id}



@frappe.whitelist()
def get_tasks(project):
    tasks = frappe.get_all(
        "Tasks",
        filters={"project": project},
        fields=["*"],
        order_by="creation desc",
    )
    for t in tasks:
        t["created_by"] = t.get("created_by") or t.get("owner")
        t["description"] = t.get("description") or ""
    return tasks
