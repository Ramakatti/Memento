import frappe

from frappe.utils import getdate

from frappe import utils



from task_blogger.date_utils import format_date,creation

@frappe.whitelist()
def get_log(date):

    formatedate = format_date(date)
    docname = frappe.db.get_value("Daily Log", {'today':formatedate},"name")

    comments = frappe.get_list("Comment", filters={"reference_name": docname,"comment_type":"Comment","comment_by":frappe.session.user}, fields=['content', 'comment_by','creation'],order_by="creation asc")

    for i in comments:
        timeline = creation(i.creation)
        i['creation'] = timeline

    return comments



@frappe.whitelist()
def get_docname():
    return frappe.db.get_value("Daily Log", {'today':str(utils.today())},"name")