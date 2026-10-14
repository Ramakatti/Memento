frappe.pages["issues"].on_page_load = function (wrapper) {
  const page = frappe.ui.make_app_page({
    parent: wrapper,
    title: "Tasking",
    single_column: true,
  });

  frappe.require(
    "/assets/task_blogger/js/component/date_carousel_small.js",
    () => {
      if (!window.dateCarouselInstance) {
        // window.dateCarouselInstance = new frappe.ui.DateCarousel();
        console.log("heloo");
        window.dateCarouselInstance = new frappe.ui.DateCarousel({
          onDateChange: function (selectedDate) {
            console.log("Selected date:", selectedDate);
            // Call your render function with the selected date
            // const dateString = "Sat Dec 13 2025 12:12:36 GMT+0530 (India Standard Time)";
            // Create a Date object from the string
            const dateObject = new Date(selectedDate);

            // Extract year, month, and day
            const year = dateObject.getFullYear();
            // Months are 0-indexed, so add 1 and pad to ensure two digits
            const month = (dateObject.getMonth() + 1)
              .toString()
              .padStart(2, "0");
            const day = dateObject.getDate().toString().padStart(2, "0");

            // Combine into YYYY-MM-DD format
            // const formattedDate = `${year}-${month}-${day}`;

            const formattedDate = `${day}-${month}-${year}`;

            console.log(formattedDate);

            // render_template(page, formattedDate);

            // $(".timeline").empty()

            // page.set_title(__(formattedDate));

            // Logs(formattedDate)
          },
        });
      } else {
        console.log("what the fuck");
      }
    },
  );
  render_template(page);
};

function render_template(page) {
  $(".main-section").empty();
  // $(page.body).empty();  // clear properly

  const page_html = `
    <div class="container1">
        <!-- Issue Header -->
        <div class="issue-header">
            <div class="issue-title">Add support for dark mode</div>
            <div class="issue-meta">#42 opened 2 days ago by <strong>john-dev</strong></div>
        </div>

        <!-- Comments Section -->
        <div class="comments-section" id="commentsSection">
            <!-- Comments will be added here -->
        </div>

        <!-- Add Comment Section -->

        <div class="comment-container">
            <div class="comment-header">
                <div class="user-avatar"></div>
                <div class="comment-title">Add a comment</div>
            </div>

            <div class="editor-container">
                <div class="tabs">
                    <button class="tab active" data-tab="write">Write</button>
                    <button class="tab" data-tab="preview">Preview</button>
                </div>

                <div class="toolbar">
                    <button class="toolbar-button" title="Bold (Ctrl+B)">
                        <strong>B</strong>
                    </button>
                    <button class="toolbar-button" title="Italic (Ctrl+I)">
                        <em>I</em>
                    </button>
                    <button class="toolbar-button" title="Strikethrough">
                        <s>S</s>
                    </button>
                    <div class="toolbar-divider"></div>
                    <button class="toolbar-button" title="Unordered list">
                        ☰
                    </button>
                    <button class="toolbar-button" title="Ordered list">
                        1️⃣
                    </button>
                    <button class="toolbar-button" title="Quote">
                        ❝
                    </button>
                    <button class="toolbar-button" title="Code">
                        &lt;/&gt;
                    </button>
                    <div class="toolbar-divider"></div>
                    <button class="toolbar-button" title="Link">
                        🔗
                    </button>
                    <button class="toolbar-button" title="Mention">
                        @
                    </button>
                    <button class="toolbar-button" title="Reference">
                        #
                    </button>
                    <button class="toolbar-button" title="Attach files">
                        📎
                    </button>
                </div>

                <div class="editor-content">
                    <div class="tab-content active" id="write-tab">
                        <textarea id="comment-text" placeholder="hello, im doing extra work today..."></textarea>
                    </div>
                    <div class="tab-content" id="preview-tab">
                        <div class="preview-content" id="preview-content">
                            Start typing to see preview...
                        </div>
                    </div>
                </div>

                <div class="footer">
                    <div class="footer-info">
                        <div class="footer-info-item" title="Markdown supported">
                            📝 Markdown is supported
                        </div>
                        <div class="footer-info-item" title="Paste, drop, or click to add files">
                            📎 Paste, drop, or click to add files
                        </div>
                    </div>
                    <button class="comment-button" id="comment-btn">Comment</button>
                </div>
            </div>
        </div>

        
    </div>`;

  $(".main-section").append(page_html);
  // $(".container").append(page_html)

  renderComments();
}

let comments = JSON.parse(localStorage.getItem("comments")) || [
  {
    id: 1,
    author: "alice-dev",
    avatar: "A",
    time: "2 days ago",
    content:
      "This is a great feature request! Dark mode would be really helpful.",
  },
  {
    id: 2,
    author: "bob-design",
    avatar: "B",
    time: "1 day ago",
    content:
      "I agree! We could use the existing color palette for the dark theme.",
  },
];

function saveComments() {
  localStorage.setItem("comments", JSON.stringify(comments));
}

function renderComments() {
  const section = document.getElementById("commentsSection");

  console.log("section", section);

  if (comments.length === 0) {
    section.innerHTML =
      '<div class="empty-state">No comments yet. Be the first to comment!</div>';
    return;
  }

  section.innerHTML = comments
    .map(
      (comment) => `
        <div class="comment" id="comment-${comment.id}">
            <div class="comment-header">
                <div class="avatar">${comment.avatar}</div>
                <div class="comment-user">
                    <div class="comment-username">${comment.author}</div>
                    <div class="comment-time">${comment.time}</div>
                </div>
                <div class="comment-actions">
                    <button class="action-btn" onclick="editComment(${comment.id})">Edit</button>
                    <button class="action-btn" onclick="deleteComment(${comment.id})">Delete</button>
                </div>
            </div>
            <div class="comment-body" id="content-${comment.id}">${comment.content}</div>
            <div class="edit-mode" id="edit-${comment.id}">
                <textarea class="editor" id="edit-text-${comment.id}" style="margin: 12px;">${comment.content}</textarea>
                <div class="modal-actions" style="padding: 0 12px;">
                    <button class="btn-save" onclick="saveComment(${comment.id})">Save</button>
                    <button class="btn-cancel" onclick="cancelEdit(${comment.id})">Cancel</button>
                </div>
            </div>
        </div>
    `,
    )
    .join("");

  $(document).on("click", ".comment-button", function (event) {
    event.preventDefault(); // Prevent default behavior
    addComment();
    console.log("add comment button clicked");
  });
}

async function addDailyLog(content) {
  // get reference name using xcall

  console.log("content ", content);

  let reference_name = await frappe.xcall(
    "task_blogger.task_blogger.page.day_to_day_v1.day_to_day_v1.get_docname",
  );

  // add comment
  frappe
    .xcall("frappe.desk.form.utils.add_comment", {
      reference_doctype: "Daily Log",
      reference_name: reference_name,
      content: content,
      comment_email: frappe.session.user,
      comment_by: frappe.session.user_fullname,
    })
    .then((comment) => {
      if (comment) {
        console.log("comment added successfully to doctype Daily Log");
        frappe.utils.play_sound("click");
      }
    });
}

function addComment() {
  // const editor = document.getElementById('comment-text');

  // const editor = $('#comment-text');
  // const editor = $('#comment-text');

  let content = $("#comment-text").val();

  //    const content = editor.value.trim();
  console.log("the content is ", content);

  // if (!content) {
  //     alert('Please enter a comment');
  //     return;
  // }

  const newComment = {
    id: Date.now(),
    author: "s-a-ga-r",
    avatar: "S",
    time: "just now",
    content: content,
  };

  comments.push(newComment);
  addDailyLog(content);
  saveComments();
  renderComments();
  $("#comment-text").val("");
  editor.val("");
}

function editComment(id) {
  document.getElementById(`content-${id}`).style.display = "none";
  document.getElementById(`edit-${id}`).classList.add("show");
  document.getElementById(`edit-text-${id}`).focus();
}

function cancelEdit(id) {
  document.getElementById(`content-${id}`).style.display = "block";
  document.getElementById(`edit-${id}`).classList.remove("show");
}

function saveComment(id) {
  const newContent = document.getElementById(`edit-text-${id}`).value.trim();
  if (!newContent) {
    alert("Comment cannot be empty");
    return;
  }

  const comment = comments.find((c) => c.id === id);
  if (comment) {
    comment.content = newContent;
    comment.time = "edited just now";
    saveComments();
    renderComments();
  }
}

function deleteComment(id) {
  if (confirm("Are you sure you want to delete this comment?")) {
    comments = comments.filter((c) => c.id !== id);
    saveComments();
    renderComments();
  }
}

function switchTab(tab) {
  document
    .querySelectorAll(".tab-content")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelectorAll(".tab")
    .forEach((el) => el.classList.remove("active"));
  document.getElementById(tab).classList.add("active");
  document
    .querySelector(`[onclick="switchTab('${tab}')"]`)
    .classList.add("active");

  if (tab === "preview") {
    const preview = document.getElementById("previewContent");
    const markdown = editor.value;
    preview.innerHTML = markdown
      ? `<div style="white-space: pre-wrap;">${escapeHtml(markdown)}</div>`
      : '<div style="color: #8b949e;">Preview will appear here...</div>';
  }
}

function insertMarkdown(before, after) {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const text = editor.value;
  const selectedText = text.substring(start, end);

  const newText =
    text.substring(0, start) +
    before +
    selectedText +
    after +
    text.substring(end);
  editor.value = newText;
  editor.focus();
  editor.selectionStart = start + before.length;
  editor.selectionEnd = start + before.length + selectedText.length;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Initial render
