frappe.listview_settings["My Projects"] = {
  refresh: function (listview) {
    // frm.trigger("onload_post_render");
    $("span.sidebar-toggle-btn").hide();
    $(".col-lg-2.layout-side-section").hide();
  },
};
