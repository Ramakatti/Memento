// Copyright (c) 2026, Sagar Patil and contributors
// For license information, please see license.txt

frappe.ui.form.on("My Projects", {
  setup(frm) {
    $("span.sidebar-toggle-btn").hide();
    $(".col-lg-2.layout-side-section").hide();
    frm.trigger("update_primary_action");
  },

  refresh(frm) {
    const field = frm.get_field("description");
    $(field.wrapper).find(".ql-editor").css({
      height: "1000px", // change as needed
      "min-height": "600px",
    });
    field.editor && field.editor.resize(); // let Ace recalculate
  },
});
