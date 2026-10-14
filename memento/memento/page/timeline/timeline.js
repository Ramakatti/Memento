// frappe.pages["timeline"].on_page_load = function (wrapper) {
//   var page = frappe.ui.make_app_page({
//     parent: wrapper,
//     title: "Timeline",
//     single_column: true,
//   });
// };

frappe.pages["timeline"].on_page_load = function (wrapper) {
  const page = frappe.ui.make_app_page({
    parent: wrapper,
    title: "Daily Timeline",
    single_column: true,
  });

    const options = frappe.route_options || {};
    const { date, task, project } = options;
    // clear so stale data doesn't leak into next visit
    frappe.route_options = null;

    console.log(date, task, project);



  $(".page-container").css("background-color", "#ffffff");
  $("body").css("background-color", "#ffffff");

  $(page.body).html(`
        <div style="display: flex; gap: 20px; padding: 15px;">
            <div class="form-footer-wrapper" style="flex: 1;"></div>
            <div class="week-picker-container" style="width: 450px; flex-shrink: 0;"></div>
        </div>
    `);

  const $body = $(page.body);
  let currentFooter = null;

  renderWeekPicker($body.find(".week-picker-container"));

  // Function to load or create Task Log by date
  async function loadTaskLogByDate(selectedDate) {
    try {
      // Format date as YYYY-MM-DD for comparison
      // console.log("selected date is", selectedDate);

      // const dateObj = frappe.datetime.str_to_obj(selectedDate);
      // console.log("dateObj",dateObj);

      // const dateStr = dateObj.toISOString().split('T')[0];
      // console.log("Searching for Task Log with today =", dateStr);

      console.log("selected date is", selectedDate);

      const dateObj = frappe.datetime.str_to_obj(selectedDate);

      console.log("dateObj", dateObj);

      const dateStr = frappe.datetime.obj_to_str(dateObj);

      console.log("Searching for Task Log with today =", dateStr);

      // Find Task Log(s) matching the selected date
      const taskLogs = await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Task Log",
          filters: {
            today: dateStr,
          },
          fields: ["name", "today"],
          limit: 1,
        },
      });

      let taskLogName;

      // If no Task Log exists, create one
      if (!taskLogs.message || taskLogs.message.length === 0) {
        console.log("No Task Log found, creating new one...");

        const newTaskLog = await frappe.call({
          method: "frappe.client.insert",
          args: {
            doc: {
              doctype: "Task Log",
              today: dateStr,
              members: [
                {
                  user: frappe.session.user,
                },
              ],
              // members:frappe.session.user
              // Add any other required fields here
            },
          },
        });

        if (!newTaskLog.message) {
          frappe.show_alert({
            message: __("Failed to create Task Log"),
            indicator: "red",
          });
          return;
        }

        taskLogName = newTaskLog.message.name;

        frappe.show_alert({
          message: __("Created new Task Log for {0}", [
            frappe.datetime.str_to_user(dateStr),
          ]),
          indicator: "green",
        });
      } else {
        taskLogName = taskLogs.message[0].name;
        console.log("Found existing Task Log:", taskLogName);
      }

      // Load the full document
      const doc = await frappe.db.get_doc("Task Log", taskLogName);

      // Load docinfo (comments, versions, attachments)
      await frappe.call({
        method: "frappe.desk.form.load.get_docinfo",
        args: {
          doctype: "Task Log",
          name: taskLogName,
        },
        callback: function (r) {
          if (r.message) {
            if (!frappe.model.docinfo["Task Log"]) {
              frappe.model.docinfo["Task Log"] = {};
            }
            frappe.model.docinfo["Task Log"][taskLogName] = r.message;
          }
        },
      });

      // Create mock frm object
      const frm = {
        doc,
        docname: doc.name,
        doctype: "Task Log",
        meta: frappe.get_meta("Task Log"),
        perm: frappe.perm.get_perm("Task Log"),

        get_docinfo: function () {
          return frappe.model.docinfo["Task Log"]?.[taskLogName] || {};
        },

        get_field: () => null,
        fields_dict: {},
        events: {},
        trigger: () => {},
        dashboard: { reset: () => {} },
      };

      // Clear previous footer
      $body.find(".form-footer-wrapper").empty();

      // Create new footer with timeline
      currentFooter = new frappe.ui.form.Footer({
        frm: frm,
        parent: $body.find(".form-footer-wrapper"),
      });

      currentFooter.refresh(doc);

      // Remove activity title if present
      let $activityTitle = $body.find(".timeline-item.activity-title");
      if ($activityTitle.length) {
        $activityTitle.remove();
      }
    } catch (error) {
      console.error("Error loading Task Log:", error);
      frappe.show_alert({
        message: __("Error loading Task Log: {0}", [error.message || error]),
        indicator: "red",
      });
    }
  }

  // Listen for date selection
  $body.find(".week-picker-container").on("date-selected", (e, date) => {
    console.log("Date selected:", date);
    loadTaskLogByDate(date);
  });

  // Load Task Log for today on page load
  frappe.model.with_doctype("Task Log", async function () {
    loadTaskLogByDate(new Date());
  });
};

// ... rest of your renderWeekPicker function stays the same ...

function renderWeekPicker($parent) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  let baseDate = new Date();
  let selectedDate = new Date();
  let isDragging = false;
  let dragStartX = 0;
  let dragStartDate = null;

  const arcYOffsets = [0, -22, -36, -42, -36, -22, 0];

  $parent.html(`
        <style>
            .week-picker { padding: 1.5rem 0 1rem; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; margin-left: 118px;margin-top: -44px;}
            .arc-container { position: relative; width: 420px; height: 110px; cursor: grab; }
            .arc-container.dragging { cursor: grabbing; }
            .arc-days { display: flex; justify-content: center; align-items: flex-end; gap: 0; width: 100%; height: 100%; }
            .day-col { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; cursor: pointer; transition: transform 0.2s ease; }
            .day-col:hover { transform: translateY(-3px); }
            .day-name { font-size: 12px; color: var(--text-muted); font-weight: 400; margin-bottom: 6px; letter-spacing: 0.03em; }
            .day-num { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 18px; font-weight: 500; color: var(--text-color); transition: all 0.2s ease; }
            .day-col.active .day-num { background: #4aadee; color: #fff; border-radius: 14px; }
            .day-col.active .day-name { color: #4aadee; font-weight: 500; }
            .day-col.muted .day-name, .day-col.muted .day-num { color: var(--text-muted); opacity: 0.5; }
            .arc-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
            .nav-row { display: flex; align-items: center; gap: 1rem; justify-content: center; }
            .nav-btn { background: none; border: 0.5px solid var(--border-color); border-radius: var(--border-radius-md); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-muted); transition: background 0.15s; }
            .nav-btn:hover { background: var(--bg-color); }
            .month-label { font-size: 14px; color: var(--text-muted); min-width: 120px; text-align: center; }
            .selected-date-box { background: var(--bg-color); border-radius: var(--border-radius-lg); padding: 0.75rem 1.25rem; font-size: 13px; color: var(--text-muted); text-align: center; }
            .selected-date-box code { font-family: var(--font-mono); font-size: 12px; color: var(--text-color); background: var(--fg-color); border: 0.5px solid var(--border-color); border-radius: 4px; padding: 2px 6px; }
        </style>
        
        <div class="week-picker">
            <div class="arc-container" id="arcContainer">
                <svg class="arc-bg" viewBox="0 0 420 110" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20,95 Q210,10 400,95" fill="none" stroke="var(--border-color)" stroke-width="1"/>
                </svg>
                <div class="arc-days" id="arcDays"></div>
            </div>
            <div class="nav-row">
                <button class="nav-btn" id="prevBtn" aria-label="Previous week">
                    <svg class="icon icon-sm"><use href="#icon-left"></use></svg>
                </button>
                <span class="month-label" id="monthLabel"></span>
                <button class="nav-btn" id="nextBtn" aria-label="Next week">
                    <svg class="icon icon-sm"><use href="#icon-right"></use></svg>
                </button>
            </div>
            <div class="selected-date-box">
                Selected: <code id="selectedDateDisplay">Today</code>
            </div>
        </div>
    `);

  const $arcContainer = $parent.find("#arcContainer");
  const $arcDays = $parent.find("#arcDays");
  const $monthLabel = $parent.find("#monthLabel");
  const $selectedDisplay = $parent.find("#selectedDateDisplay");

  function getWeekStart(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function render() {
    const weekStart = getWeekStart(baseDate);
    $arcDays.empty();

    const colWidth = 420 / 7;

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);

      const isSelected = d.toDateString() === selectedDate.toDateString();
      const isMuted = d.getMonth() !== baseDate.getMonth();

      const $col = $(`
                <div class="day-col ${isSelected ? "active" : ""} ${isMuted ? "muted" : ""}" 
                     style="width: ${colWidth}px; padding-bottom: ${Math.abs(arcYOffsets[i])}px;">
                    <span class="day-name">${days[d.getDay()]}</span>
                    <div class="day-num">${d.getDate()}</div>
                </div>
            `);

      $col.on(
        "click",
        ((currentDate) => {
          return () => {
            selectedDate = new Date(currentDate);
            render();
            updateSelectedDisplay();
            $parent.trigger("date-selected", [selectedDate]);
          };
        })(d),
      );

      $arcDays.append($col);
    }
    updateMonthLabel();
  }

  function updateMonthLabel() {
    const ws = getWeekStart(baseDate);
    const we = new Date(ws);
    we.setDate(ws.getDate() + 6);

    const label =
      ws.getMonth() === we.getMonth()
        ? `${months[ws.getMonth()]} ${ws.getFullYear()}`
        : `${months[ws.getMonth()].slice(0, 3)} – ${months[we.getMonth()].slice(0, 3)} ${we.getFullYear()}`;

    $monthLabel.text(label);
  }

  function updateSelectedDisplay() {
    const display = selectedDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    $selectedDisplay.text(display);
  }

  // Mouse drag
  $arcContainer.on("mousedown", function (e) {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartDate = new Date(baseDate);
    $arcContainer.addClass("dragging");
    e.preventDefault();
  });

  $(document).on("mousemove", function (e) {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartX;
    const dayShift = -Math.round(deltaX / 60);

    if (dayShift !== 0) {
      baseDate = new Date(dragStartDate);
      baseDate.setDate(baseDate.getDate() + dayShift);
      render();
    }
  });

  $(document).on("mouseup", function () {
    if (!isDragging) return;
    isDragging = false;
    $arcContainer.removeClass("dragging");
  });

  // Touch support
  $arcContainer.on("touchstart", function (e) {
    dragStartX = e.touches[0].clientX;
    dragStartDate = new Date(baseDate);
  });

  $arcContainer.on("touchmove", function (e) {
    const deltaX = e.touches[0].clientX - dragStartX;
    const dayShift = -Math.round(deltaX / 60);

    if (dayShift !== 0) {
      baseDate = new Date(dragStartDate);
      baseDate.setDate(baseDate.getDate() + dayShift);
      render();
    }
  });

  // Mouse wheel
  $arcContainer.on("wheel", function (e) {
    e.preventDefault();
    baseDate.setDate(
      baseDate.getDate() + (e.originalEvent.deltaY > 0 ? 7 : -7),
    );
    render();
  });

  // Navigation buttons
  $parent.find("#prevBtn").on("click", () => {
    baseDate.setDate(baseDate.getDate() - 7);
    render();
  });

  $parent.find("#nextBtn").on("click", () => {
    baseDate.setDate(baseDate.getDate() + 7);
    render();
  });

  // Initialize
  render();
  updateSelectedDisplay();
}




////////////////////////////////////////////////////////////////////////////


// This code i found from frappe forum to checking dialog box select field is not working properly. I have added this code in timeline.js file. Please check and let me know if you need any changes.



// random_app_name.dialogs.updateVisitDialog = function (name) {
//     frappe.call({
//         method: 'random_app_name.random_project___prod.doctype.lead_database_prod.lead_database_prod.visit_child_data',
//         args: {
//             name: name
//         },
//         callback: function(message) {
//             if (message.message) {
//                 let value = message.message;
//                 const updateItemsData = value.final_data.map(item => ({
//                     employee_name: item.employee_name,
//                     brand_visit_item: item.brand_visit_item,
//                     item_group_visit_item: item.item_group_visit_item,
//                     item_name_visit_item: item.item_name_visit_item,
//                     quantity_visit_item: item.quantity_visit_item,
//                     price_range_visit_item: item.price_range_visit_item,
//                     category_visit_item: item.category_visit_item,
//                     date_visit_child: item.date_visit_child,
//                     delivery_date: item.delivery_date,
//                     status_visit_child: item.status_visit_child
//                 }));
//                 let dialog = new frappe.ui.Dialog({
//                     title: __("Update Items"),
//                     fields: [
//                         {
//                             label: __("Visit Details"),
//                             fieldname: "update_visit_detail",
//                             fieldtype: "Table",
//                             fields: [
//                                 {
//                                     fieldname: "employee_name",
//                                     label: __("Employee Name"),
//                                     fieldtype: "Link",
//                                     options: "Users AP Prod",
//                                     in_list_view: 1,
//                                     columns: 1
//                                 },
//                                 {
//                                     fieldname: "brand_visit_item",
//                                     label: __("Brand Name"),
//                                     fieldtype: "Link",
//                                     options: 'Brand Name Prod',
//                                     in_list_view: 1,
//                                     columns: 1
//                                 },
//                                 {
//                                     fieldname: "item_group_visit_item",
//                                     label: __("Item Group"),
//                                     fieldtype: "Link",
//                                     options: 'Item Group AP Prod',
//                                     in_list_view: 1,
//                                     columns: 1
//                                 },
//                                 {
//                                     fieldname: "item_name_visit_item",
//                                     label: __("Item Name"),
//                                     fieldtype: "Link",
//                                     options: 'Item Name AP Prod',
//                                     in_list_view: 1,
//                                     columns: 1,
//                                     get_query: function (doc) {
//                                         const brand = doc.brand_visit_item;
//                                         const itemGroup = doc.item_group_visit_item;
//                                         return {
//                                             query: 'random_app_name.controllers.queries.item_name_visit_item_query',
//                                             filters: {
//                                                 'associate_brand_item_ap': brand,
//                                                 'associated_item_group_item_ap': itemGroup
//                                             }
//                                         };
//                                     }
//                                 },
//                                 {
//                                     fieldname: "quantity_visit_item",
//                                     label: __("Quantity"),
//                                     fieldtype: "Float",
//                                     in_list_view: 1,
//                                     columns: 1
//                                 },
//                                 {
//                                     fieldname: "price_range_visit_item",
//                                     label: __("Price"),
//                                     fieldtype: "Currency",
//                                     non_negative: 1,
//                                     precision: 0,
//                                     in_list_view: 1,
//                                     columns: 1
//                                 },
//                                 {
//                                     fieldname: "category_visit_item",
//                                     label: __("Category"),
//                                     fieldtype: "Select",
//                                     options : "Buyer\nSeller",
//                                     in_list_view: 1,
//                                     columns: 1
//                                 },
//                                 {
//                                     fieldname: "date_visit_child",
//                                     label: __("Date of Visit"),
//                                     fieldtype: "Date",
//                                     in_list_view: 1,
//                                     columns: 1
//                                 },
//                                 {
//                                     fieldname: "delivery_date",
//                                     label: __("Delivery Date"),
//                                     fieldtype: "Date",
//                                     in_list_view: 1,
//                                     columns: 1
//                                 },
//                                 {
//                                     fieldname: "status_visit_child",
//                                     label: __("Status"),
//                                     fieldtype: "Select",
//                                     options: "Inquiry\nCancelled\nDelivered\nReturned",
//                                     in_list_view: 1,
//                                     columns: 1
//                                 }
//                             ],
//                             data: updateItemsData,
//                             in_place_edit: true,
//                             cannot_add_rows: true
//                         }
//                     ],
//                     size: 'extra-large',
//                     primary_action_label: __("Update"),
//                     primary_action: function() {
//                         let updatedData = dialog.fields_dict.update_visit_detail.grid.get_data();
//                         frappe.call({
//                             method: 'random_app_name.random_project___prod.doctype.lead_database_prod.lead_database_prod.update_record',
//                             args: {
//                                 name: name,
//                                 updated_data: updatedData
//                             },
//                             callback: function (response) {
//                                 if (response.message) {
//                                     frappe.msgprint(__('Data Updated successfully.'));
//                                     dialog.hide();
//                                 } else {
//                                     frappe.msgprint(__('Failed to update data.'));
//                                 }
//                             }
//                         })
//                     }
//                 })
//                dialog.set_df_property('status_visit_child', 'options', "Inquiry\nCancelled\nDelivered\nReturned");
//                dialog.set_df_property('category_visit_item', 'options', "Buyer\Seller");
//               dialog.show();
//             } else {
//                 frappe.msgprint(__('No data returned from the API.'));
//             }
//         }
//     })
// }