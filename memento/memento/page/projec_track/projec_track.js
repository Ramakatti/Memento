frappe.pages["projec-track"].on_page_load = function (wrapper) {
  new Projects(wrapper);
};

// frappe.pages['task-blogging-v2'].on_page_load = function (wrapper) {
//     new TaskBlogApp(wrapper);
// }

class Projects {
  constructor(wrapper) {
    this.wrapper = wrapper;
    this.init();
  }

  init() {
    this.page = frappe.ui.make_app_page({
      parent: this.wrapper,
      title: "ProjecTrack",
      single_column: true,
    });

    this.project = null;
    // Frappe keeps this page alive when you leave it, so re-apply the look when it is shown
    // again, and give the body back to Frappe when you leave.
    $(this.wrapper).on("show", () => {
      this.setViewBackground(this.currentView || "project");
      if (this.currentView === "task") taskModelcss();
    });

    $(this.wrapper).on("hide", () => {
      document.body.style.removeProperty("background-color");
    });

    this.renderTemplate();
  }

  renderTemplate() {
    console.log("renderTemplate Called");
    // localStorage.clear();

    if (window.location.pathname !== "/app/projec-track") {
        console.log("window.location was ", window.location.pathname);
        console.log("checking current folder ,",this.current_folder);
        history.pushState({ project: this.project}, "", "/app/projec-track");
        this.page.set_title(__(this.current_folder));
        $('.custom-actions .ellipsis').hide();
    }


    // this.page-head flex.empty();
    $("footer").remove();
    $("#build-events-overlay").remove();
    // $('#body').remove()

    $(".page-head").html("");
    $(frappe.render_template("projec_track", {})).appendTo(this.page.main);
    this.setViewBackground("project");

    this.projects = JSON.parse(localStorage.getItem("ProjectPosts") || "[]");
    this.posts = JSON.parse(localStorage.getItem("blogPosts") || "[]");

    this.selectedPriority = "medium";
    this.currentFilter = "all";
    this.currentProjectId = null;
    this.taskFilter = "all";

    // this.initSampleData();
    this.renderProjects();
    this.updateStats();
    this.bindEvents();
    this.createProject();
    this.closeCreateProject();
    this.deleteProject();
    this.closeViewer();

    // this.openProject()
  }

  

  renderProjects() {
    let self = this;

    // console.log("in sample");

    frappe.db
      .get_list("My Projects", {
        fields: ["*"],
        // order_by: 'employee_name asc',
        limit: 100,
      })
      .then((records) => {
        console.log("Rendered Projects:", records);

        self.projects = records;
        // console.log("TOTAL PROJECTS FROM DOCTYPE:", self.projects.length);

        // self.saveProjects();

        // console.log("records", records);
        // console.log(self.projects);

        const projectPosts = document.getElementById("projectPosts");

        let filteredProjects = self.projects;

        // console.log("filteredProjects", filteredProjects);

        switch (this.currentFilter) {
          case "today":
            const today = new Date().toDateString();

            // CHANGED: uses the real DocType date field (start_date) through isToday()
            // filteredProjects = self.projects.filter(
            //   (task) => new Date(task.startTime).toDateString() === today,
            // );
            filteredProjects = self.projects.filter((task) =>
              self.isToday(task),
            );

            break;

          case "high":
            // CHANGED: the DocType field is priority_level ("High" / "high")
            // filteredProjects = self.projects.filter(
            //   (task) => task.priority === "high",
            // );
            filteredProjects = self.projects.filter(
              (task) =>
                String(task.priority_level || "").toLowerCase() === "high",
            );

            break;

          case "completed":
            // CHANGED: status compared through normStatus()
            // filteredProjects = self.projects.filter(
            //   (task) => task.status === "completed",
            // );
            filteredProjects = self.projects.filter(
              (task) => self.normStatus(task.status) === "completed",
            );

            break;

          case "pending":
            // CHANGED: status compared through normStatus()
            // filteredProjects = self.projects.filter(
            //   (task) => task.status === "pending",
            // );
            filteredProjects = self.projects.filter(
              (task) => self.normStatus(task.status) === "pending",
            );

            break;
        }

        if (filteredProjects.length === 0) {
          console.log("no task found");

          projectPosts.innerHTML = `
            <div class="empty-state">
                <h3>No tasks found</h3>
                <p>Start by creating your first task!</p>
            </div>
          `;

          return;
        }

        // CHANGED: the card no longer shows the category (WORK / PERSONAL) – removed from the
        // title and from the old details row. The category field itself is untouched.
        // CHANGED: description sits directly under the title.

        // CHANGED: Delete hidden from the card (deleteProject() logic is still below).
        projectPosts.innerHTML = filteredProjects
          .map(
            (p) => `
      <div class="project-post" data-project-id=${p.name}>
          <div class="project-post-header">

              <div class="task-author-avatar">
                  ${(p.user || frappe.session.user).charAt(0)}
              </div>

              <div class="project-post-meta">
                  <div class="task-author-name">
                      ${p.user || frappe.session.user}
                  </div>

                  <div class="project-post-date">
                      ${self.formatDate(p.creation)}
                  </div>
              </div>

              <span class="project-y ${p.priority_level}">
                  ${p.priority_level.toUpperCase()}
              </span>

              <div class="project-status ${p.status.replace("-", "")}">
                  ${p.status.replace("-", " ").toUpperCase()}
              </div>

          </div>

          <h2 class="project-title">
              ${p.project_name}
          </h2>

          ${
            p.description
              ? `<div class="project-description">${frappe.utils.escape_html(
                  $("<div>").html(p.description).text(),
                )}</div>`
              : ""
          }

          <div class="post-actions">

              <button
                  class="action-btn view-btn"
                  data-project-id=${p.name}
              >
                  Read More
              </button>

              <span class="project-time">
                  ${this.formatDateTime(p.start_date)} -
                  ${this.formatDateTime(p.end_date)}
              </span>

              <!-- hidden from the card, handler kept in deleteProject()
              <button
                  class="action-btn delete-btn"
                  data-project-id=${p.name}
              >
                  Delete
              </button>
              -->

          </div>

      </div>
    `,
          )
          .join("");

        this.viewProject();
        this.updateStats();
        this.openProject();
      });
  }

  renderTasks(project) {
    self = this;

    const blogPosts = document.getElementById("blogPosts");

    if (this.posts.length === 111) {
      blogPosts.innerHTML = `
        <div class="empty-state">
            <h3>No Task yet</h3>
            <p>Start by creating your first blog post!</p>
        </div>
      `;

      return;
    }

    // console.log(this.posts);

    console.log(`Task rendered for project ${project}`);

    frappe.call({
      method: "memento.memento.page.projec_track.projec_track.get_tasks",
      args: {
        project: project,
      },

      callback: function (r) {
        if (r.message.length == 0) {
          console.log("r message got the tasks ", r.message);

          blogPosts.innerHTML = `
            <div class="empty-state">
                <h3>No Task yet</h3>
                <p>Start by creating your first blog post!</p>
            </div>
          `;

          return;
        }

        let filteredTasks = r.message;

        switch (self.taskFilter) {
          case "today":
            filteredTasks = r.message.filter((task) => self.isTaskToday(task));
            break;

          case "completed":
            filteredTasks = r.message.filter(
              (task) => self.normStatus(task.status) === "completed",
            );
            break;

          case "pending":
            filteredTasks = r.message.filter(
              (task) => self.normStatus(task.status) === "pending",
            );

            break;

          case "all":
          default:
            filteredTasks = r.message;
            break;
        }

        if (filteredTasks.length === 0) {
          blogPosts.innerHTML = `
            <div class="empty-state">
                <h3>No Task found</h3>
                <p>No tasks match this filter.</p>
            </div>
          `;

          return;
        }

        blogPosts.innerHTML = filteredTasks
          .map(
            (post) => `
              <div class="blog-post" data-project-id=${post.project} data-project-id=${post.name}>

                  <div class="post-header">

                      <div class="author-avatar">
                          ${(post.avatar = "A")}
                      </div>

                     <div class="post-meta">

                      <div class="author-name">
                          ${post.created_by}
                      </div>

                      <div class="post-date">
                       ${post.creation}
                      </div>

                  </div>

                <div class="task-status ${String(post.status || "Open").replace(/[\s-]+/g, "")}">
                 ${String(post.status || "Open")
                   .replace(/-/g, " ")
                   .toUpperCase()}
               </div>

                  </div>

                  <h2 class="post-title">
                      ${post.task_name}
                  </h2>

                  <div class="post-content">
                      ${post.description.replace(/\n/g, "<br>")}
                  </div>

              </div>
            `,
          )
          .join("");
      },
    });

    // frappe.db
    //   .get_list("Tasks", {
    //     fields: ["*"],
    //     filters: {
    //       members: frappe.session.user,
    //       project: project,
    //     },
    //     // order_by: 'employee_name asc',
    //     limit: 10,
    //   })
    //   .then((t) => {
    //     console.log(t);
    //     self.posts = t;
    //     if (t.length === 0) {
    //       blogPosts.innerHTML = `
    //                 <div class="empty-state">
    //                     <h3>No Task yet</h3>
    //                     <p>Start by creating your first task!</p>
    //                 </div>
    //             `;
    //       return;
    //     }
    //     blogPosts.innerHTML = t
    //       .map(
    //         (post) => `
    //             <div class="blog-post">
    //                 <div class="post-header">
    //                     <div class="author-avatar">${(post.avatar = "A")}</div>
    //                     <div class="post-meta">
    //                         <div class="author-name">${post.created_by}</div>
    //                         <div class="post-date">${post.creation}</div>
    //                     </div>
    //                 </div>
    //                 <h2 class="post-title">${post.task_name}</h2>
    //                 <div class="post-content">${post.description.replace(/\n/g, "<br>")}</div>
    //             </div>
    //         `,
    //       )
    //       .join("");
    //   });

    // blogPosts.innerHTML = this.posts
    //   .map(
    //     (post) =>
    //       console.log("post-", post)`
    //         <div class="blog-post">
    //             <div class="post-header">
    //                 <div class="author-avatar">${post.avatar}</div>
    //                 <div class="post-meta">
    //                     <div class="author-name">${post.author}</div>
    //                     <div class="post-date">${post.date}</div>
    //                 </div>
    //             </div>
    //             <h2 class="post-title">${post.title}</h2>
    //             <div class="post-content">${post.content.replace(/\n/g, "<br>")}</div>
    //         </div>
    //     `,
    //   )
    //   .join("");

    taskModelcss();
    this.goBack();
  }

  openProject() {
    let self = this;

    // Opening the task post where those tasks are belongs to this project.
    $(document)
      .off("click", ".project-post")
      .on("click", ".project-post", function (event) {
        event.preventDefault();
        event.stopPropagation();

        // Prevent the click event from propagating to the parent project-post div
        // var project = $(".project-post").data("project-id");

        let project = $(this).data("project-id");

        self.project = project;

        let base_url = window.location.pathname

        console.log("base_url", base_url, "project :", project);


        let newUrl = base_url.split("projec-track")[0] + "projec-track/" + project; 
        history.pushState({ project: project }, "", newUrl);

        // console.log("project", project);
        // console.log("Task List opened of this project");

        $(".container2").html("");
        $(".container2").addClass("task-view"); //added
        self.setViewBackground("task"); //added
        $("#open-modal").remove();

        let container_content = `
          <div class="post-main-content">

              <div id="blogPosts">
                  <!-- Sample posts will be loaded here -->
              </div>

          </div>

          <div class="sidebar">

              <h3>Our Sidebar</h3>

              <ul class="sidebar-menu">

                  <li class="task-filter active" data-filter="all">
                      All Tasks
                  </li>

                  <li class="task-filter" data-filter="today">
                      Today's Tasks
                  </li>

                  <li class="task-filter" data-filter="completed">
                      Completed
                  </li>

                  <li class="task-filter" data-filter="pending">
                      Pending
                  </li>

                 

                  <li class="go-back">
                      <i class="fa fa-arrow-left"></i>
                      Back
                  </li>

              </ul>

          </div>

          <button
              class="add-task-btn"
              data-project-id="${project}"
              id="open-task-modal">
              +
          </button>

          <div id="postModal" class="modal">

              <div class="modal-content">

                  <div class="modal-header1">

                      <h2 class="modal-title">
                          Create New Post
                      </h2>

                      <button
                          class="close-btn"
                          onclick="closeModal()"
                      >
                          &times;
                      </button>

                  </div>

                  <form id="postForm">

                      <div class="form-group">

                          <label for="authorName">
                              Author Name
                          </label>

                          <input
                              type="text"
                              id="authorName"
                              name="authorName"
                              required
                          >

                      </div>

                      <div class="form-group">

                          <label for="postTitle">
                              Post Title
                          </label>

                          <input
                              type="text"
                              id="postTitle"
                              name="postTitle"
                              required
                          >

                      </div>

                      <div class="datetime-row">

                          <div class="form-group">

                              <label for="startTime">
                                  Start Time
                              </label>

                              <input
                                  type="datetime-local"
                                  id="startTime"
                                  name="startTime"
                                  required
                              >

                          </div>

                          <div class="form-group">

                              <label for="endTime">
                                  End Time
                              </label>

                              <input
                                  type="datetime-local"
                                  id="endTime"
                                  name="endTime"
                              >

                          </div>

                      </div>

                      <div class="form-group">

                          <label for="postContent">
                              Post Content
                          </label>

                          <textarea
                              id="postContent"
                              name="postContent"
                              required
                          ></textarea>

                      </div>

                      <div style="text-align: right;">

                          <button
                              type="button"
                              class="cancel-btn"
                              onclick="closeModal()"
                          >
                              Cancel
                          </button>

                          <button
                              type="submit"
                              class="submit-btn"
                          >
                              Publish Post
                          </button>

                      </div>

                  </form>

              </div>

          </div>
        `;

        $(".container2").append(container_content);

        self.renderTasks(project);
        self.createTask();
        self.opnenTask();

        // geting style for task model
      });
  }

  createTask() {
    let me = this;

    $(document).on("click","#open-task-modal",function (event) {
        console.log("creating task ...");

      // document.getElementById('postModal').style.display = 'block';

      let project = $(this).data("project-id");

      console.log("creating task for project ", project);

      let new_docname = frappe.model.make_new_doc_and_get_name("Tasks");

      frappe.set_route("Form", "Tasks", new_docname);

      // old dialog code remains commented
    });
  }

  opnenTask() {
    let self = this;

    $(document).on("click",".blog-post",function (event) {
        console.log("clicked");
        const taskDate = $(this).data("task-date") ||
        frappe.datetime.nowdate();
        const taskName = $(this).data("post-title");
        const projectName = this.project;
        // $(this).data("project-name");

        frappe.route_options = {
            date: taskDate,
            task: taskName,
            project: projectName,
        };

      // Navigate to comment-section-v3 with date parameter
      frappe.set_route("timeline");
    });
  }

  bindEvents() {
    document.getElementById("projectForm").addEventListener("submit", (e) => {
      e.preventDefault();

      // this.addTask();
      this.addProject();
    });

    document.querySelectorAll(".priority-tag").forEach((tag) => {
      tag.addEventListener("click", (e) => {
        document
          .querySelectorAll(".priority-tag")
          .forEach((t) => t.classList.remove("selected"));

        e.target.classList.add("selected");

        this.selectedPriority = e.target.dataset.priority;
      });
    });

    // NEW: Main page Project filters
    const me = this;

    $(document)
      .off("click", ".sidebar-menu li.project-filter[data-filter]")
      .on("click", ".sidebar-menu li.project-filter[data-filter]", function () {
        me.filterTasks($(this).data("filter"));
      });

    // NEW: Task page filters
    $(document)
      .off("click", ".sidebar-menu li.task-filter[data-filter]")
      .on("click", ".sidebar-menu li.task-filter[data-filter]", function () {
        me.filterTaskPosts($(this).data("filter"));
      });

    // Close modals when clicking outside
    document.getElementById("projectModal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) {
        this.closeModal();
      }
    });

    document
      .getElementById("blogReaderModal")
      .addEventListener("click", (e) => {
        if (e.target === e.currentTarget) {
          this.closeBlogReader();
        }
      });

    document.getElementById("deleteModal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) {
        this.closeDeleteModal();
      }
    });

    // Set default datetime
    this.setDefaultDateTime();
  }

  // Read project
  viewProject() {
    let self = this;

    // CHANGED: .off() added so re-rendering after a filter click does not stack handlers
    $(document)
      .off("click", ".view-btn")
      .on("click", ".view-btn", function (event) {
        event.stopPropagation();

        console.log("view-blog clicked");

        let projectId = $(this).data("project-id");

        console.log("project_id :", projectId);

        console.log("My Projects", self.projects);

        const project = self.projects.find((p) => p.name === projectId);

        console.log("the project", project);

        if (!project) {
          console.error(`Project with ID ${projectId} not found`);
          return;
        }

        console.log("Opening BlogPage for project:", projectId);

        frappe.set_route("blog-page", projectId);
        return;

        const blogReaderHTML = `
          <div
              id="blogReaderModal"
              class="blog-reader-content"
          >

              <div class="blog-reader-header">

                  <div class="blog-reader-meta">

                      <div class="blog-reader-avatar">
                          ${(project.user || frappe.session.user).charAt(0)}
                      </div>

                      <div class="blog-reader-author-info">

                          <div class="blog-reader-author-name">
                              ${project.user || frappe.session.user}
                          </div>

                          <div class="blog-reader-date">
                              ${self.formatDate(project.creation)}
                          </div>

                      </div>

                      <div class="blog-reader-actions">

                          <button
                              class="action-btn delete-btn"
                          >
                              Delete
                          </button>

                      </div>

                      <div class="blog-reader-actions">

                          <button
                              class="action-btn close-viewer"
                          >
                              Close
                          </button>

                      </div>

                  </div>

              </div>

              <div class="blog-reader-content-body">

                  <h1 class="blog-reader-title">
                      ${project.project_name}
                  </h1>

                  <div class="blog-reader-text">
                      ${(project.description || "").replace(/\n/g, "<br>")}
                  </div>

                  <div class="blog-reader-details">

                      <div class="blog-reader-detail-item">

                          <div class="blog-reader-detail-label">
                              Category
                          </div>

                          <div class="blog-reader-detail-value">
                              ${
                                project.category.charAt(0).toUpperCase() +
                                project.category.slice(1)
                              }
                          </div>

                      </div>

                      <div class="blog-reader-detail-item">

                          <div class="blog-reader-detail-label">
                              Priority
                          </div>

                          <div class="blog-reader-detail-value">
                              ${
                                project.priority_level.charAt(0).toUpperCase() +
                                project.priority_level.slice(1)
                              }
                          </div>

                      </div>

                      <div class="blog-reader-detail-item">

                          <div class="blog-reader-detail-label">
                              Status
                          </div>

                          <div class="blog-reader-detail-value">
                              ${project.status.replace("-", " ").toUpperCase()}
                          </div>

                      </div>

                      <div class="blog-reader-detail-item">

                          <div class="blog-reader-detail-label">
                              Start Time
                          </div>

                          <div class="blog-reader-detail-value">
                              ${self.formatFullDateTime(project.start_date)}
                          </div>

                      </div>

                      <div class="blog-reader-detail-item">

                          <div class="blog-reader-detail-label">
                              End Time
                          </div>

                          <div class="blog-reader-detail-value">
                              ${self.formatFullDateTime(project.end_date)}
                          </div>

                      </div>

                      <div class="blog-reader-detail-item">

                          <div class="blog-reader-detail-label">
                              Duration
                          </div>

                          <div class="blog-reader-detail-value">
                              ${self.calculateDuration(
                                project.start_date,
                                project.end_date,
                              )}
                          </div>

                      </div>

                  </div>

              </div>

          </div>
        `;

        // Clear the container and append the blog reader content
        $(".container2").html("");
        $(".container2").css("display", "block");

        $(".container2").append(blogReaderHTML);
      });
  }

  goBack() {
    let self = this;

    $(document).off("click", ".go-back") // yours: stops handlers stacking up
      .on("click", ".go-back", function (event) {
        event.preventDefault(); // upstream
        event.stopPropagation(); // upstream

        console.log("back clicked");

        let current_url = window.location.pathname; // upstream

        console.log("Current URL:", current_url);

        $("#task-page-styles").remove(); // yours: removes the task CSS

        // Remove the last part (/project_id)
        let url = current_url.substring(0, current_url.lastIndexOf("/"));

        // console.log("Current URL:", current_url);
        console.log("Back URL:", url);

        // history.pushState({}, "", url);

        history.pushState({ project: self.project }, "", url);
        $(".container2").remove();
        self.renderTemplate();
      });
  }

  createProject() {
    let me = this;

    $(document).on("click", "#open-modal", function (event) {
      let new_docname = frappe.model.make_new_doc_and_get_name("My Projects");

      frappe.set_route("Form", "My Projects", new_docname);

      // old dialog code remains commented
    });
  }

  closeCreateProject() {
    $(document).on("click", ".close-model", function (event) {
      console.log("close clicked");

      document.getElementById("projectModal").style.display = "none";
    });
  }

  closeViewer() {
    let self = this;

    $(document).on("click", ".close-viewer", function (event) {
      console.log("close clicked");

      $(".container2").remove();

      self.closeBlogReader();
    });
  }

  closeBlogReader() {
    // document.getElementById('blogReaderModal').style.display = 'none';

    $("#blogReaderModal").remove();
    $(".container2").remove();

    this.currentTaskId = null;

    this.renderTemplate();
  }

  confirmDeleteProject(taskId) {
    let self = this;

    this.currentTaskId = taskId;

    document.getElementById("deleteModal").style.display = "block";

    $(document).on("click", ".confirm-delete-btn", function (event) {
      event.stopPropagation();

      console.log("confirm clicked clicked");

      self.deletingProject();
    });
  }

  deleteProject() {
    let self = this;

    $(document).on("click", ".delete-btn", function (event) {
      event.stopPropagation();
      event.preventDefault();

      console.log("delete project clicked");

      let project = $(this).data("project-id");

      console.log("project id", project);

      self.confirmDeleteProject(project);
    });

    $(document).on("click", ".cancel-btn", function (event) {
      console.log("cancel");

      self.closeDeleteModal();
    });
  }

  closeDeleteModal() {
    document.getElementById("deleteModal").style.display = "none";

    this.currentTaskId = null;
  }

  confirmDelete() {
    if (!this.currentTaskId) return;

    document.getElementById("deleteModal").style.display = "block";
  }

  deletingProject() {
    let self = this;

    if (!this.currentTaskId) return;

    this.projects = this.projects.filter(
      (task) => task.id !== this.currentTaskId,
    );

    console.log("current project id", this.currentTaskId);

    frappe.call({
      method: "memento.memento.page.projec_track.projec_track.delete_project",

      args: {
        project_id: this.currentTaskId,
      },

      callback: function (r) {
        if (r.message.status === "Success") {
          console.log("callback project_id : ", r.message.project_id);

          const $projectBox = $(
            `.project-post[data-project-id="${r.message.project_id}"]`,
          );

          console.log("Found file box:", $projectBox.length);

          if ($projectBox.length > 0) {
            console.log("vanishing roject here");

            $projectBox.fadeOut(150, function () {
              $(this).remove();
            });
          } else {
            console.error("Element not found!");
          }

          frappe.show_alert(
            {
              message: __("Project Deleted Successfully"),
              indicator: "green",
            },
            5,
          );

          // Refresh the project list after deletion
          // self.renderProjects();
          // self.updateStats();

          self.closeDeleteModal();
          self.closeBlogReader();
        } else {
          frappe.show_alert(
            {
              message: __("Failed to Delete Project"),
              indicator: "red",
            },
            5,
          );
        }
      },
    });
  }

  addProject() {
    let self = this;

    console.log("hello");

    const form = document.getElementById("projectForm");

    const formData = new FormData(form);

    const newProject = {
      title: formData.get("taskTitle"),

      description: formData.get("taskDescription"),

      category: formData.get("taskCategory"),

      priority: this.selectedPriority,

      status: formData.get("taskStatus"),

      startTime: formData.get("startTime"),

      endTime: formData.get("endTime"),

      createdAt: new Date().toISOString(),

      author: "TaskUser",
    };

    console.log(newProject);
    console.log(typeof newProject);

    frappe.call({
      method:
        "task_blogger.task_blogger.page.task_blogging.task_blogging.new_project",
      args: {
        user: frappe.session.user,
        newproject: newProject,
      },

      async: false,

      callback: function (r) {
        if (r.message.status == "Success") {
          frappe.show_alert(
            {
              message: __("Successfully Created New Project"),
              indicator: "green",
            },
            5,
          );

          self.closeModal();
        }
      },
    });

    this.projects.unshift(newProject);

    // this.saveProjects();
    // this.renderTasks();

    this.renderProjects();
    this.updateStats();

    this.closeModal();

    form.reset();

    this.setDefaultDateTime();

    // Reset priority selection
    document
      .querySelectorAll(".priority-tag")
      .forEach((t) => t.classList.remove("selected"));

    document.querySelector(".priority-tag.medium").classList.add("selected");

    this.selectedPriority = "medium";
  }

  addTask() {
    console.log("helo");

    const form = document.getElementById("postForm");

    const formData = new FormData(form);

    const newTask = {
      id: Date.now(),

      blogger: formData.get("authorName"),

      taskTitle: formData.get("postTitle"),

      content: formData.get("postContent"),

      priority: this.selectedPriority,

      status: formData.get("taskStatus"),

      startTime: formData.get("startTime"),

      endTime: formData.get("endTime"),

      createdAt: new Date().toISOString(),

      author: "TaskUser",
    };

    this.projects.unshift(newTask);

    this.saveProjects();
    this.renderTasks();
    this.updateStats();
    this.closeModal();

    form.reset();

    this.setDefaultDateTime();

    document.querySelectorAll(".priority-tag").forEach((t) => t.classList.remove("selected"));

    document.querySelector(".priority-tag.medium").classList.add("selected");

    this.selectedPriority = "medium";
  }

  // openModal() {
  //     document.getElementById('projectModal').style.display = 'block';
  // }

  closeModal() {
    document.getElementById("projectModal").style.display = "none";
  }

  saveProjects() {
    localStorage.setItem("ProjectPosts", JSON.stringify(this.projects));
  }

  savePosts() {
    localStorage.setItem("blogPosts",JSON.stringify(this.posts));
  }

  updateStats() {
    const today = new Date().toDateString();

    // CHANGED: real DocType date field through isToday()
    // const todayTasks = this.projects.filter(
    //   (task) => new Date(task.startTime).toDateString() === today,
    // );
    const todayTasks = this.projects.filter((task) => this.isToday(task));

    // CHANGED: status compared through normStatus()
    // const completedTasks = this.projects.filter(
    //   (task) => task.status === "completed",
    // );
    const completedTasks = this.projects.filter(
      (task) => this.normStatus(task.status) === "completed",
    );

    // CHANGED: status compared through normStatus()
    // const pendingTasks = this.projects.filter(
    //   (task) => task.status === "pending",
    // );
    const pendingTasks = this.projects.filter(
      (task) => this.normStatus(task.status) === "pending",
    );

    document.getElementById("total-projects").textContent =
      this.projects.length;

    $("#total-projects").text(this.projects.length);

    document.getElementById("todayTasks").textContent = todayTasks.length;

    document.getElementById("completedTasks").textContent =
      completedTasks.length;

    document.getElementById("pendingTasks").textContent = pendingTasks.length;
  }

  // NEW: "In Progress" / "in-progress" / "Completed" / "completed" -> lower case, no spaces/hyphens
  normStatus(status) {
    return String(status || "")
      .toLowerCase()
      .replace(/[\s-]+/g, "");
  }

  // NEW: true when the project's date field (start_date, startTime as fallback) is today
  isToday(project) {
    const d = project.start_date || project.startTime;

    if (!d) return false;

    return String(d).slice(0, 10) === frappe.datetime.get_today();
  }

  // NEW: true when the task's expected start date is today
  isTaskToday(task) {
    const d = task.expected_start_date || task.start_date || task.startTime;

    if (!d) return false;

    return String(d).slice(0, 10) === frappe.datetime.get_today();
  }
  // NEW: sets the page background for the current view directly on this page's own
  // wrapper, so global CSS / Frappe / the other view can never change it.
  setViewBackground(view) {
    this.currentView = view;
    const color = view === "task" ? "#f5f5f5" : "#f5f5f7";

    $(this.wrapper)
      .add($(this.wrapper).find(".page-body"))
      .each(function () {
        this.style.setProperty("background-color", color, "important");
      });

    this.wrapper.style.setProperty("min-height", "100vh", "important");
  }
  formatDate(dateStr) {
    const date = new Date(dateStr);

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  formatDateTime(dateTimeStr) {
    const date = new Date(dateTimeStr);

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  formatFullDateTime(dateTimeStr) {
    const date = new Date(dateTimeStr);

    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  calculateDuration(startTime, endTime) {
    const start = new Date(startTime);

    const end = new Date(endTime);

    const diffMs = end - start;

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  }

  filterTasks(filter) {
    this.currentFilter = filter;

    // NEW: highlight the selected Project Dashboard filter
    $(".sidebar-menu li.project-filter[data-filter]")
      .removeClass("active")
      .filter(`[data-filter="${filter}"]`)
      .addClass("active");

    // CHANGED: the filters apply to the project cards on the main page
    this.renderProjects();
  }

  // NEW: separate filters for tasks inside an opened project
  filterTaskPosts(filter) {
    this.taskFilter = filter;

    $(".sidebar-menu li.task-filter[data-filter]")
      .removeClass("active")
      .filter(`[data-filter="${filter}"]`)
      .addClass("active");

    this.renderTasks(this.currentProjectId);
  }

  setDefaultDateTime() {
    const now = new Date();

    const startTime = new Date(now.getTime() + 30 * 60000);

    const endTime = new Date(now.getTime() + 90 * 60000);

    document.getElementById("startTime").value = startTime
      .toISOString()
      .slice(0, 16);

    document.getElementById("endTime").value = endTime
      .toISOString()
      .slice(0, 16);
  }

  get_fields(project) {
    const fields = [
      {
        fieldtype: "Data",
        label: "Project Name",
        fieldname: "project_name",
      },

      // {
      //   fieldtype: "Data",
      //   label: "Project",
      //   fieldname: "project",
      //   read_only: true,
      // },

      {
        fieldtype: "Date",
        label: "Expected Start Date",
        fieldname: "expected_start_date",
      },

      {
        fieldtype: "Date",
        label: "Expected End Date",
        fieldname: "expected_end_date",
      },

      {
        fieldtype: "Data",
        label: "Status",
        fieldname: "status",
        default: "Open",
      },

      {
        fieldtype: "Select",
        label: "Priority",
        fieldname: "priority",

        onchange: function () {
          me.select_priorities();
        },
      },

      {
        fieldtype: "Select",
        label: "Priority",
        fieldname: "priority",
        options: "High \nMedium \nLow",
        default: "Medium",
      },

      {
        fieldtype: "Text Editor",
        label: "Task Description",
        fieldname: "description",
      },
    ];

    return fields;
  }

  get_task_fields() {
    const fields1 = [
      {
        fieldtype: "Data",
        label: "Task Name",
        fieldname: "task_name",
      },

      {
        fieldtype: "Data",
        label: "Project",
        fieldname: "project",
        default: this.project,
        read_only: true,
      },

      {
        fieldtype: "Date",
        label: "Expected Start Date",
        fieldname: "expected_start_date",
      },

      {
        fieldtype: "Date",
        label: "Expected End Date",
        fieldname: "expected_end_date",
      },

      {
        fieldtype: "Data",
        label: "Status",
        fieldname: "status",
        default: "Open",
      },

      // {
      //   fieldtype: "Select",
      //   label: "Priority",
      //   fieldname: "priority",
      //   options: ["High", "Medium", "Low"],
      //   reqd: 1,
      //   default: "Medium",
      // },

      {
        fieldtype: "Select",
        label: "Priority",
        fieldname: "priority",
        options: "High\nMedium\nLow",
        in_list_view: 1,
        columns: 1,
        // default: "Medium",
      },

      {
        fieldtype: "Text Editor",
        label: "Task Description",
        fieldname: "description",
      },
    ];

    return fields1;
  }

  select_priorities() {
    this.dialog.set_df_property("priority", "options", [
      "High",
      "Medium",
      "Low",
    ]);

    // let value = this.dialog.get_value("priority");
    // console.log(value);
    // this.dialog.set_value("priority", value);

    this.dialog.refresh_field("priority");
  }

  guess_language() {
    // when attach print for print format changes try to guess language
    // if print format has language then set that else boot lang.

    // Print language resolution:
    // 1. Document's print_language field
    // 2. print format's default field
    // 3. user lang
    // 4. system lang
    // 3 and 4 are resolved already in boot

    let document_lang = this.frm?.doc?.language;

    let print_format = this.dialog.get_value("select_print_format");

    let print_format_lang;

    if (print_format != "Standard") {
      print_format_lang = frappe.get_doc(
        "Print Format",
        print_format,
      )?.default_print_language;
    }

    let lang = document_lang || print_format_lang || frappe.boot.lang;

    this.dialog.set_value("print_language", lang);
  }
}

function taskModelcss() {
  // console.log("Task css");
  $("#task-page-styles").remove();

  let container_css = `

    .container2 {
        "max-width": "1200px",
        "margin": "0 auto",
        "padding": "20px",
        "display": "grid",
        "grid-template-columns": "1fr 300px",
        "gap": "30px"
    }

    .container2,
    .container2 * {
    box-sizing: border-box;
    }
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        background-color: #f5f5f5;
        color: #333;
        line-height: 1.6;
    }

    .post-main-content {
        background: transparent;
    }

    .blog-post {
      background: white;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition:
      transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
    }
     .blog-post:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

    } 

    .blog-post:last-child {
        margin-bottom: 0;
    }

    .post-header {
        display: flex;
        align-items: flex-start;
        margin-bottom: 15px;
        padding-bottom: 15px;
        border-bottom: 1px solid #f1f3f4;
    }
    .task-status {
        margin-left: auto;
        flex: none;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.3px;
    }

      /* Open - light blue */
    .task-status.Open {
        background: #e3effc;
        color: #2878b5;
    }

    /* Pending - same light orange as project cards */
    .task-status.Pending {
        background: #fff0d9;
        color: #b36b00;
    } 

      /* Working - light purple */
    .task-status.Working {
        background: #eee7ff;
        color: #7357b8;
    }

    /* Completed - same light green as project cards */
    .task-status.Completed {
        background: #dff5e3;
        color: #2e7d32;
    }

    /* Cancelled - light red */
    .task-status.Cancelled {
        background: #f8d7da;
        color: #721c24;
      }

      /* Also supports "In Progress" if that value is used */
    .task-status.InProgress {
        background: #eee7ff;
        color: #7357b8;
      }


    .author-avatar {
        width: 35px;
        height: 35px;
        border-radius: 50%;
        margin-right: 15px;
        margin-top: 2px;
        background-color: #6c757d;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
    }

    .author-name {
        font-weight: 600;
        color: #4a90e2;
        font-size: 13px;
        margin-bottom: 2px;
    }

    .post-date {
        color: #868e96;
        font-size: 11px;
    }

    .post-title {
        font-size: 20px;
        font-weight: 600;
        color: #495057;
        margin-bottom: 15px;
        line-height: 1.3;
    }

    .post-content {
        color: #6c757d;
        font-size: 14px;
        line-height: 1.6;
        margin-bottom: 15px;
    }

    .sidebar {
        background: white;
        border-radius: 8px;
        padding: 25px;
        height: fit-content;
        position: sticky;
        top: 20px;
    }

    .sidebar h3 {
        font-size: 18px;
        font-weight: 600;
        color: #495057;
        margin-bottom: 10px;
    }

    .sidebar-description {
        color: #6c757d;
        font-size: 14px;
        margin-bottom: 25px;
    }

    .sidebar-menu {
        list-style: none;
    }

    .sidebar-menu li {
        padding: 12px 0;
        margin: 0;
        border-bottom: 1px solid #f1f3f4;
        color: #6c757d;
        font-size: 14px;
        cursor: pointer;
        transition: color 0.3s ease;
    }

    .sidebar-menu li:hover {
        color: #4a90e2;
    }

    .sidebar-menu li:last-child {
        border-bottom: none;
    }

    .add-post-btn {
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: #4a90e2;
        color: white;
        border: none;
        border-radius: 50%;
        width: 60px;
        height: 60px;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
        transition: all 0.3s ease;
        z-index: 1000;
    }

    .add-post-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4);
    }

    .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 2000;
    }

    .modal-header1 {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .modal-title {
        font-size: 20px;
        font-weight: 600;
        color: #495057;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6c757d;
    }

    .form-group {
        margin-bottom: 20px;
    }

    .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 600;
        color: #495057;
        font-size: 14px;
    }

    .form-group input,
    .form-group textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        font-size: 14px;
        transition: border-color 0.3s ease;
    }

    .form-group input:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: #4a90e2;
    }

    .form-group textarea {
        resize: vertical;
        min-height: 120px;
    }

    .submit-btn {
        background: #4a90e2;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.3s ease;
    }

    .submit-btn:hover {
        background: #357abd;
    }

    .cancel-btn {
        background: #6c757d;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        margin-right: 10px;
        transition: background 0.3s ease;
    }

    .cancel-btn:hover {
        background: #5a6268;
    }

    @media (max-width: 768px) {
        .container {
            grid-template-columns: 1fr;
            gap: 20px;
            padding: 10px;
        }

        .blog-post {
            padding: 20px;
        }

        .sidebar {
            order: -1;
        }
    }

    .empty-state {
        text-align: center;
        padding: 60px 30px;
        color: #6c757d;
    }

    .empty-state h3 {
        font-size: 18px;
        margin-bottom: 10px;
    }

    .empty-state p {
        font-size: 14px;
    }`;
  // SCOPE: wrap the whole task stylesheet so it only applies inside the task view
  // (CSS nesting). Nothing in it can leak to the Project Track page .
  container_css = `.container2.task-view { ${container_css} }`;

  $("#task-page-styles").remove();

  $("<style>", {
    id: "task-page-styles",
    text: container_css,
  }).appendTo("head");
}

// createProject() {
//     $(document).on("click", "#open-model", function (event) {
//         console.log("creating task ...")
//         // document.getElementById('postModal').style.display = 'block';
//         let project = $(this).data('project-id');
//         console.log("creating task for project ",project);

//         let d = new frappe.ui.Dialog({
//             title: "Create Task for project "+project,
//             fields: [
//                 { fieldtype: 'Data', label: 'Project Name', fieldname: 'project_name' },
//                 { fieldtype: 'Data', label: 'Project', fieldname: 'project',default:project,read_only:true},
//                 { fieldtype: 'Date', label: 'Expected Start Date', fieldname: 'expected_start_date'},
//                 { fieldtype: 'Date', label: 'Expected End Date', fieldname: 'expected_end_date'},
//                 { fieldtype: 'Data', label: 'Status', fieldname: 'status', default:'Open'},
//                 { fieldtype: 'Select', label: 'Priority', fieldname: 'priority', options: ['High', 'Medium', 'Low'],reqd: 1, default:'Medium'},
//                 { fieldtype: 'Select', label: 'Priority', fieldname: 'priority', options: 'High \nMedium \nLow',default:'Medium'},
//                 { fieldtype: 'Text Editor', label: 'Task Description', fieldname: 'description' },
//                 // { fieldtype: 'Data', label: 'created', fieldname: 'task_name' },
//             ],
//             primary_action_label: 'Create Task',
//             primary_action(values) {

//                 frappe.xcall("task_blogger.task_blogger.page.task_blogging.task_blogging.new_task", {
//                     new_task: values
//                 }).then(r => {
//                     console.log(r);

//                     d.hide();

//                     const newTask = {
//                         id: Date.now(),
//                         blogger: values.frappe.session.user,
//                         taskTitle: values.task_name,
//                         content: values.description,
//                         priority: this.selectedPriority,
//                         status: values.status,
//                         startTime: values.expected_start_date,
//                         endTime: values.expected_end_date,
//                         createdAt: new Date().toISOString(),
//                         author: 'TaskUser'
//                     };

//                     frappe.msgprint(`Task ${values.task_name} Created Successfully !`);

//                     this.projects.unshift(newTask);
//                     this.saveProjects();
//                     this.renderTasks();
//                     this.updateStats();
//                     this.closeModal();
//                     form.reset();
//                     this.setDefaultDateTime();

//                     // Reset priority selection
//                     document.querySelectorAll('.priority-tag').forEach(t => t.classList.remove('selected'));
//                     document.querySelector('.priority-tag.medium').classList.add('selected');
//                     this.selectedPriority = 'medium';

//                 });
//             }
//         });
//         d.show();
//         var values = d.get_values();
//         console.log("values",values);

//     })

// }

/////////////////////////////////////////////////////////////////////

// console.log("postmodel opened",$.fn.datepicker);
// console.log(typeof $.fn.datepicker);
// console.log("with window vanila js",window.AirDatepicker);

// new AirDatepicker('#startTime', {
//     view: 'months',
//     minView: 'months',
//     dateFormat: 'MMMM yyyy'
// })

// new AirDatepicker('#endTime', {
//     view: 'months',
//     minView: 'months',
//     dateFormat: 'MMMM yyyy'
// })

//////////////////////////////////////////////////////////////////////////////////////////////////////

// viewTask(taskId) {
//     const task = task.projects.find(t => t.id === taskId);
//     if (!task) return;
//     this.currentTaskId = taskId;
//     // Populate blog reader modal
//     document.getElementById('blogTitle').textContent = task.title;
//     document.getElementById('blogAvatar').textContent = task.author.charAt(0);
//     document.getElementById('blogAuthor').textContent = task.author;
//     document.getElementById('blogDate').textContent = this.formatDate(task.createdAt);
//     document.getElementById('blogContent').innerHTML = task.description.replace(/\n/g, '<br>');

//     // $(".container2").html("");

//     // Populate task details

//     document.getElementById('blogDetails').innerHTML = `
//         <div class="blog-reader-detail-item">
//             <div class="blog-reader-detail-label">Category</div>
//             <div class="blog-reader-detail-value">${task.category.charAt(0).toUpperCase() + task.category.slice(1)}</div>
//         </div>
//         <div class="blog-reader-detail-item">
//             <div class="blog-reader-detail-label">Priority</div>
//             <div class="blog-reader-detail-value">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</div>
//         </div>
//         <div class="blog-reader-detail-item">
//             <div class="blog-reader-detail-label">Status</div>
//             <div class="blog-reader-detail-value">${task.status.replace('-', ' ').toUpperCase()}</div>
//         </div>
//         <div class="blog-reader-detail-item">
//             <div class="blog-reader-detail-label">Start Time</div>
//             <div class="blog-reader-detail-value">${this.formatFullDateTime(task.startTime)}</div>
//         </div>
//         <div class="blog-reader-detail-item">
//             <div class="blog-reader-detail-label">End Time</div>
//             <div class="blog-reader-detail-value">${this.formatFullDateTime(task.endTime)}</div>
//         </div>
//         <div class="blog-reader-detail-item">
//             <div class="blog-reader-detail-label">Duration</div>
//             <div class="blog-reader-detail-value">${this.calculateDuration(task.startTime, task.endTime)}</div>
//         </div>
//     `;

//     // Show blog reader modal
//     document.getElementById('blogReaderModal').style.display = 'block';
// }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Global functions

// function openModal() {
//     taskBlogApp.openModal();
// }

// function closeModal() {
//     taskBlogApp.closeModal();
// }

// function filterTasks(filter) {
//     taskBlogApp.filterTasks(filter);
// }

// function viewTask(taskId) {
//     taskBlogApp.viewTask(taskId);
// }

// function confirmDeleteTask(taskId) {
//     taskBlogApp.confirmDeleteTask(taskId);
// }

// function deleteTask() {
//     taskBlogApp.deleteTask();
// }

// function closeBlogReader() {
//     taskBlogApp.closeBlogReader();
// }

// function closeDeleteModal() {
//     taskBlogApp.closeDeleteModal();
// }

// function confirmDelete() {
//     taskBlogApp.confirmDelete();
// }

// // Initialize app
// let taskBlogApp;
// document.addEventListener('DOMContentLoaded', () => {
//     taskBlogApp = new TaskBlogApp();
// });

// // Keyboard shortcuts
// document.addEventListener('keydown', (e) => {
//     if (e.key === 'Escape') {
//         closeModal();
//         closeBlogReader();
//         closeDeleteModal();
//     }
// });
