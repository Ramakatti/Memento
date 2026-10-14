
frappe.pages["blog-page"].on_page_load = function (wrapper) {

    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: "BlogPage",
        single_column: true
    });


    // ==========================================
    // GET PROJECT ID FROM ROUTE
    // ==========================================

    const route = frappe.get_route();

    console.log("FULL ROUTE:", route);

    const projectId = route[1];

    console.log("PROJECT ID FROM ROUTE:", projectId);


    // ==========================================
    // NO PROJECT ID
    // ==========================================

    if (!projectId) {

        $(page.main).html(`

            <div class="memento-blog">

                <h1>
                    No Project Selected
                </h1>

                <p>
                    Please open a project using the
                    <strong>Read More</strong> button.
                </p>

            </div>

        `);

        return;
    }


    // ==========================================
    // LOAD PROJECT FROM MY PROJECTS
    // ==========================================

    console.log(
        "Fetching My Projects document:",
        projectId
    );


    frappe.db.get_doc(
        "My Projects",
        projectId
    )

    .then(function (project) {

        console.log(
            "===================================="
        );

        console.log(
            "PROJECT DATA RECEIVED:"
        );

        console.log(project);

        console.log(
            "PROJECT NAME:",
            project.project_name
        );

        console.log(
            "USER:",
            project.user
        );

        console.log(
            "CATEGORY:",
            project.category
        );

        console.log(
            "STATUS:",
            project.status
        );

        console.log(
            "PRIORITY:",
            project.priority_level
        );

        console.log(
            "START DATE:",
            project.start_date
        );

        console.log(
            "END DATE:",
            project.end_date
        );

        console.log(
            "DESCRIPTION:",
            project.description
        );

        console.log(
            "DOCUMENT NAME:",
            project.name
        );

        console.log(
            "===================================="
        );


        // ==========================================
        // RENDER BLOG PAGE
        // ==========================================

        $(page.main).html(`

            <article class="memento-blog">


                <!-- ==================================
                     ACTION BUTTONS
                =================================== -->

                <div class="blog-actions">

                    <button
                        class="blog-close-btn"
                        type="button"
                    >
                        Close
                    </button>

                    <button
                        class="blog-delete-btn"
                        type="button"
                    >
                        Delete
                    </button>

                </div>


                <!-- ==================================
                     PROJECT TITLE
                =================================== -->

                <h1 class="blog-title">

                    ${
                        project.project_name ||
                        "Untitled Project"
                    }

                </h1>


                <!-- ==================================
                     BLOG INTRODUCTION
                =================================== -->

                <p class="blog-intro">
                project is a temporary team effort designed to achieve a specific goal within a set timeframe and budget. It follows a structured lifecycle—moving from initial planning and execution to final monitoring and closure.

                </p>


                <!-- ==================================
                     AUTHOR
                =================================== -->

                <div class="blog-author">

                    <img
                        class="author-avatar"
                        alt="A"
                    >

                    <div class="author-info">

                        <div class="author-name">

                            ${
                                project.user ||
                                "Anonymous User"
                            }

                        </div>


                        <div class="author-meta">

                            ${
                                project.creation
                                    ? frappe.datetime.str_to_user(
                                          project.creation
                                      )
                                    : "Date not available"
                            }

                            · 4 min read

                        </div>

                    </div>

                </div>


                <!-- ==================================
                     PROJECT DETAILS
                =================================== -->

                <h2>
                    Project Details
                </h2>


                <div class="project-details">

                    <div class="detail-row">

                        <strong>
                            Project ID
                        </strong>

                        <span>
                            ${project.name || "-"}
                        </span>

                    </div>


                    <div class="detail-row">

                        <strong>
                            Start Date
                        </strong>

                        <span>
                            ${project.start_date || "-"}
                        </span>

                    </div>


                    <div class="detail-row">

                        <strong>
                            End Date
                        </strong>

                        <span>
                            ${project.end_date || "-"}
                        </span>

                    </div>


                    <div class="detail-row">

                        <strong>
                            Category
                        </strong>

                        <span>
                            ${project.category || "-"}
                        </span>

                    </div>


                    <div class="detail-row">

                        <strong>
                            Priority
                        </strong>

                        <span>
                            ${project.priority_level || "-"}
                        </span>

                    </div>


                    <div class="detail-row">

                        <strong>
                            Status
                        </strong>

                        <span>
                            ${project.status || "-"}
                        </span>

                    </div>

                </div>


                <!-- ==================================
                     PROJECT DESCRIPTION
                =================================== -->

                <h2>
                    Project Description
                </h2>


                <div class="project-description">

                    ${
                        project.description ||
                        "<p>No project description has been added yet.</p>"
                    }

                </div>


                <!-- ==================================
                     ABOUT PROJECT
                =================================== -->

                <h2>
                    About This Project
                </h2>


                <p>

                    This project is documented using the
                    <strong>Memento</strong> module to keep
                    project information organized and easy
                    to understand.

                </p>


                <p>

                    The project belongs to

                    <strong>
                        ${
                            project.category ||
                            "Project"
                        }
                    </strong>

                    category and currently has a status of

                    <strong>
                        ${
                            project.status ||
                            "Not specified"
                        }
                    </strong>.

                </p>


                <!-- ==================================
                     PYTHON EXAMPLE
                =================================== -->

                <h2>
                    Frappe Python Example
                </h2>


                <p>

                    This example demonstrates how a Frappe
                    backend method can retrieve information
                    from a DocType.

                </p>


                <div class="code-card">

                    <div class="code-header">

                        <span class="code-language">
                            Python
                        </span>

                        <button
                            class="copy-code"
                            type="button"
                        >
                            Copy
                        </button>

                    </div>


                    <pre><code><span class="code-keyword">import</span> frappe

<span class="code-decorator">@frappe.whitelist()</span>
<span class="code-keyword">def</span> <span class="code-function">get_project_details</span>(project_id):

    <span class="code-keyword">if</span> <span class="code-keyword">not</span> project_id:

        <span class="code-keyword">return</span> {

            <span class="code-string">"success"</span>:
                <span class="code-keyword">False</span>,

            <span class="code-string">"message"</span>:
                <span class="code-string">"Project ID is required"</span>

        }

    project = frappe.<span class="code-function">get_doc</span>(
        <span class="code-string">"My Projects"</span>,
        project_id
    )

    <span class="code-keyword">return</span> {

        <span class="code-string">"name"</span>: project.name,
        <span class="code-string">"project_name"</span>: project.project_name,
        <span class="code-string">"status"</span>: project.status,
        <span class="code-string">"category"</span>: project.category,
        <span class="code-string">"priority"</span>: project.priority_level

    }</code></pre>

                </div>


                <!-- ==================================
                     JAVASCRIPT EXAMPLE
                =================================== -->

                <h2>
                    Frappe JavaScript Example
                </h2>


                <p>

                    Frappe JavaScript can retrieve DocType
                    records and display information on the
                    client side.

                </p>


                <div class="code-card">

                    <div class="code-header">

                        <span class="code-language">
                            JavaScript
                        </span>

                        <button
                            class="copy-code"
                            type="button"
                        >
                            Copy
                        </button>

                    </div>


                    <pre><code><span class="code-keyword">function</span> <span class="code-function">loadProject</span>(projectId) {

    <span class="code-keyword">if</span> (!projectId) {

        console.<span class="code-function">error</span>(
            <span class="code-string">"Project ID is missing"</span>
        );

        <span class="code-keyword">return</span>;
    }

    frappe.db.<span class="code-function">get_doc</span>(
        <span class="code-string">"My Projects"</span>,
        projectId
    ).<span class="code-function">then</span>(<span class="code-keyword">function</span>(project) {

        console.<span class="code-function">log</span>(
            <span class="code-string">"Project:"</span>,
            project
        );

        console.<span class="code-function">log</span>(
            <span class="code-string">"Name:"</span>,
            project.project_name
        );

        console.<span class="code-function">log</span>(
            <span class="code-string">"Status:"</span>,
            project.status
        );

        console.<span class="code-function">log</span>(
            <span class="code-string">"Category:"</span>,
            project.category
        );

    }).<span class="code-function">catch</span>(<span class="code-keyword">function</span>(error) {

        console.<span class="code-function">error</span>(
            <span class="code-string">"Failed to load project:"</span>,
            error
        );

    });

}</code></pre>

                </div>


                <!-- ==================================
                     DOCTYPES
                =================================== -->

                <h2>
                    Working With DocTypes
                </h2>


                <p>

                    Frappe DocTypes provide a structured way
                    to store and manage application data.

                    In this project, the
                    <strong>My Projects</strong>
                    DocType stores the project information
                    displayed on this page.

                </p>


                <ul>

                    <li>
                        DocTypes define application data.
                    </li>

                    <li>
                        Fields define the structure of records.
                    </li>

                    <li>
                        Python handles server-side operations.
                    </li>

                    <li>
                        JavaScript handles client-side behaviour.
                    </li>

                    <li>
                        Frappe APIs connect frontend and backend.
                    </li>

                </ul>


                <!-- ==================================
                     QUOTE
                =================================== -->

                <blockquote class="blog-quote">

                    <strong>

                        Plan the project.
                        Document the work.
                        Build the solution.

                    </strong>

                </blockquote>


                <!-- ==================================
                     CONCLUSION
                =================================== -->

                <h2>
                    Conclusion
                </h2>


                <p>

                    This project page demonstrates how
                    project information can be presented
                    using the Memento blog layout.

                    Project details, descriptions, DocType
                    information, and development examples
                    are organized in one place.

                </p>


                <h3>
                    Memento Project Blog
                </h3>


                <p>

                    This page is part of the
                    <strong>Memento</strong> module and is
                    used to document project information
                    and progress.

                </p>


            </article>

        `);


        // ==========================================
        // CLOSE BUTTON
        // ==========================================

        $(page.main).on(
            "click",
            ".blog-close-btn",
            function () {

                frappe.set_route(
                    "projec-track"
                );

            }
        );


        // ==========================================
        // DELETE BUTTON
        // ==========================================

        $(page.main).on(
            "click",
            ".blog-delete-btn",
            function () {

                frappe.confirm(

                    "Are you sure you want to delete this project?",

                    function () {

                        console.log(
                            "Deleting project:",
                            project.name
                        );


                        frappe.call({

                            method:
                                "memento.memento.page.projec_track.projec_track.delete_project",

                            args: {

                                project_id:
                                    project.name

                            },


                            callback: function (response) {

                                if (!response.exc) {

                                    frappe.show_alert({

                                        message:
                                            "Project deleted successfully",

                                        indicator:
                                            "green"

                                    });


                                    frappe.set_route(
                                        "projec-track"
                                    );

                                }

                            }

                        });

                    }

                );

            }
        );


        // ==========================================
        // COPY CODE BUTTON
        // ==========================================

        $(page.main).on(
            "click",
            ".copy-code",
            function () {

                const button = this;


                const code = $(button)
                    .closest(".code-card")
                    .find("code")
                    .text();


                navigator.clipboard
                    .writeText(code)

                    .then(function () {

                        button.innerText =
                            "Copied!";


                        setTimeout(
                            function () {

                                button.innerText =
                                    "Copy";

                            },
                            1500
                        );

                    })


                    .catch(function () {

                        button.innerText =
                            "Failed";

                    });

            }
        );

    })


    // ==========================================
    // ERROR
    // ==========================================

    .catch(function (error) {

        console.error(
            "FAILED TO LOAD MY PROJECTS:",
            error
        );


        $(page.main).html(`

            <div class="memento-blog">

                <h1>
                    Unable to Load Project
                </h1>

                <p>
                    The project could not be loaded.
                </p>

                <p>

                    Project ID:

                    <strong>
                        ${projectId}
                    </strong>

                </p>

            </div>

        `);

    });

};