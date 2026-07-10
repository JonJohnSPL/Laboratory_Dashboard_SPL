(function () {
  "use strict";

  const REFRESH_INTERVAL = 15000;
  const WIP_STORAGE_KEY = "lab-wip-workorders";
  const MAX_WIP_ROWS = 11;
  const MAX_JOBS_PER_DAY = 5;

  const byId = (id) => document.getElementById(id);

  let refreshInProgress = false;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character]));
  }

  function padNumber(value) {
    return String(value).padStart(2, "0");
  }

  function localDateKey(date) {
    return [
      date.getFullYear(),
      padNumber(date.getMonth() + 1),
      padNumber(date.getDate())
    ].join("-");
  }

  function parseDate(value) {
    if (!value) {
      return null;
    }

    const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T12:00:00`
      : value;

    const date = new Date(normalizedValue);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  function startOfCurrentWeek() {
    const date = new Date();

    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));

    return date;
  }

  function addDays(date, amount) {
    const nextDate = new Date(date);

    nextDate.setDate(nextDate.getDate() + amount);

    return nextDate;
  }

  function formatShortDate(date) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  }

  function updateClock() {
    const now = new Date();

    byId("clock").textContent = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });

    byId("date-label").textContent = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric"
    });
  }

  function getWorkOrderTestCount(workOrder) {
    if (Array.isArray(workOrder.testRows)) {
      return workOrder.testRows.filter((row) => !row?.subcontracted).length;
    }

    if (workOrder.counts && typeof workOrder.counts === "object") {
      return Object.values(workOrder.counts).reduce(
        (total, value) => total + (Number(value) || 0),
        0
      );
    }

    return (
      (Number(workOrder.gas) || 0) +
      (Number(workOrder.liq) || 0)
    );
  }

  function getClientName(workOrder) {
    return (
      workOrder.clientName ||
      workOrder.client ||
      workOrder.clientCode ||
      "Client not listed"
    );
  }

  function getActiveWorkOrders(workOrders) {
    return workOrders
      .filter((workOrder) => {
        const stage = String(workOrder.stage || "").toLowerCase();

        return (
          !workOrder.complete &&
          stage !== "complete" &&
          stage !== "done"
        );
      })
      .sort((left, right) => {
        const leftDate = parseDate(left.dueDate);
        const rightDate = parseDate(right.dueDate);

        return (
          (leftDate?.getTime() || Number.MAX_SAFE_INTEGER) -
          (rightDate?.getTime() || Number.MAX_SAFE_INTEGER)
        );
      });
  }

  function renderWorkOrders(workOrders) {
    const today = localDateKey(new Date());
    const openWorkOrders = getActiveWorkOrders(workOrders);

    const overdueCount = openWorkOrders.filter(
      (workOrder) => workOrder.dueDate && workOrder.dueDate < today
    ).length;

    const dueTodayCount = openWorkOrders.filter(
      (workOrder) => workOrder.dueDate === today
    ).length;

    byId("metric-open").textContent = openWorkOrders.length;
    byId("metric-overdue").textContent = overdueCount;
    byId("metric-due").textContent = dueTodayCount;

    if (!openWorkOrders.length) {
      byId("wip-list").innerHTML = `
        <div class="empty-state">No open laboratory work orders.</div>
      `;

      return;
    }

    byId("wip-list").innerHTML = openWorkOrders
      .slice(0, MAX_WIP_ROWS)
      .map((workOrder) => {
        const overdue =
          workOrder.dueDate &&
          workOrder.dueDate < today;

        const priority = String(
          workOrder.priority || ""
        ).toUpperCase();

        const stage = String(
          workOrder.stage || "Running"
        );

        let badgeClass = "";

        if (priority === "HIGH" || priority === "URGENT") {
          badgeClass = "high";
        } else if (stage.toLowerCase().includes("pending")) {
          badgeClass = "pending";
        }

        const badgeText =
          priority === "HIGH" || priority === "URGENT"
            ? priority
            : stage;

        const dueDate = parseDate(workOrder.dueDate);

        return `
          <article class="wip-row">
            <div>
              <div class="work-order-title">
                WO ${escapeHtml(workOrder.number || "—")}
                ·
                ${escapeHtml(getClientName(workOrder))}
              </div>

              <div class="work-order-subtitle">
                ${escapeHtml(
                  workOrder.projectName ||
                  workOrder.project ||
                  workOrder.notes ||
                  "Active laboratory work"
                )}
              </div>
            </div>

            <div class="due-date ${overdue ? "overdue" : ""}">
              ${dueDate ? escapeHtml(formatShortDate(dueDate)) : "No date"}

              ${
                overdue
                  ? `<div class="work-order-subtitle">Overdue</div>`
                  : ""
              }
            </div>

            <div class="test-count">
              ${getWorkOrderTestCount(workOrder)}
            </div>

            <span class="status-badge ${badgeClass}">
              ${escapeHtml(badgeText)}
            </span>
          </article>
        `;
      })
      .join("");
  }

  function getFieldJobDate(job) {
    return parseDate(
      job.scheduled_start ||
      job.requested_date
    );
  }

  function getJobTime(job) {
    if (!job.scheduled_start) {
      return "Time TBD";
    }

    const date = parseDate(job.scheduled_start);

    if (!date) {
      return "Time TBD";
    }

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function renderFieldSchedule(data) {
    const weekStart = startOfCurrentWeek();
    const weekEnd = addDays(weekStart, 6);
    const todayKey = localDateKey(new Date());

    byId("week-label").textContent =
      `${formatShortDate(weekStart)} – ${formatShortDate(weekEnd)}`;

    const clients = new Map(
      data.clients.map((client) => [
        client.id,
        client.client_name
      ])
    );

    const projects = new Map(
      data.projects.map((project) => [
        project.id,
        project.project_name
      ])
    );

    const sites = new Map(
      data.sites.map((site) => [
        site.id,
        site.site_name
      ])
    );

    const employees = new Map(
      data.employees.map((employee) => {
        const employeeName =
          employee.employee_name ||
          [
            employee.employee_first_name,
            employee.employee_last_name
          ]
            .filter(Boolean)
            .join(" ");

        return [employee.id, employeeName];
      })
    );

    const technicianAssignments = new Map();

    data.assignments
      .filter(
        (assignment) =>
          assignment.assignment_type === "Technician"
      )
      .forEach((assignment) => {
        if (!technicianAssignments.has(assignment.job_id)) {
          technicianAssignments.set(assignment.job_id, []);
        }

        technicianAssignments
          .get(assignment.job_id)
          .push(
            employees.get(assignment.resource_id) ||
            "Assigned technician"
          );
      });

    const endBoundary = addDays(weekEnd, 1);

    const weeklyJobs = data.jobs
      .filter((job) => {
        const jobDate = getFieldJobDate(job);

        return (
          jobDate &&
          jobDate >= weekStart &&
          jobDate < endBoundary
        );
      })
      .sort((left, right) => {
        return (
          (getFieldJobDate(left)?.getTime() || 0) -
          (getFieldJobDate(right)?.getTime() || 0)
        );
      });

    byId("metric-field").textContent = weeklyJobs.length;

    byId("metric-today").textContent = weeklyJobs.filter((job) => {
      const date = getFieldJobDate(job);

      return date && localDateKey(date) === todayKey;
    }).length;

    byId("schedule-grid").innerHTML = Array.from(
      { length: 7 },
      (_, dayIndex) => {
        const day = addDays(weekStart, dayIndex);
        const dayKey = localDateKey(day);

        const dayJobs = weeklyJobs.filter((job) => {
          const jobDate = getFieldJobDate(job);

          return jobDate && localDateKey(jobDate) === dayKey;
        });

        const jobCards = dayJobs
          .slice(0, MAX_JOBS_PER_DAY)
          .map((job) => {
            const priorityClass = String(
              job.priority || ""
            ).toLowerCase();

            const title =
              clients.get(job.client_id) ||
              job.scope_summary ||
              job.job_type ||
              "Field Job";

            const location =
              projects.get(job.project_id) ||
              sites.get(job.site_id) ||
              job.job_type ||
              "Location TBD";

            const technicians =
              technicianAssignments.get(job.id) || [];

            return `
              <article class="field-job ${escapeHtml(priorityClass)}">
                <div class="job-time">
                  ${escapeHtml(getJobTime(job))}
                </div>

                <div class="job-title">
                  ${escapeHtml(title)}
                </div>

                <div class="job-meta">
                  ${escapeHtml(location)}
                  <br>
                  ${escapeHtml(
                    technicians.length
                      ? technicians.join(", ")
                      : "Unassigned"
                  )}
                </div>
              </article>
            `;
          })
          .join("");

        const additionalJobs =
          dayJobs.length > MAX_JOBS_PER_DAY
            ? `
              <div class="more-jobs">
                +${dayJobs.length - MAX_JOBS_PER_DAY} more
              </div>
            `
            : "";

        return `
          <div class="schedule-day ${dayKey === todayKey ? "today" : ""}">
            <div class="day-heading">
              <span class="day-name">
                ${day.toLocaleDateString("en-US", {
                  weekday: "short"
                })}
              </span>

              <span class="day-number">
                ${day.getDate()}
              </span>
            </div>

            <div class="day-jobs">
              ${
                jobCards ||
                `<div class="empty-state">No jobs</div>`
              }

              ${additionalJobs}
            </div>
          </div>
        `;
      }
    ).join("");
  }

  async function refreshDashboard() {
    if (refreshInProgress || document.hidden) {
      return;
    }

    refreshInProgress = true;

    byId("sync-status").textContent = "Refreshing…";
    byId("sync-dot").className = "";

    try {
      await (window.authReadyPromise || Promise.resolve());

      if (!window.appAuth?.requestJson) {
        throw new Error("The application authentication service is unavailable.");
      }

      const request = window.appAuth.requestJson;

      const [
        appState,
        jobs,
        clients,
        projects,
        sites,
        assignments,
        employees
      ] = await Promise.all([
        request(
          `/rest/v1/app_state?select=storage_value&storage_key=eq.${encodeURIComponent(
            WIP_STORAGE_KEY
          )}`
        ),

        request("/rest/v1/field_jobs?select=*"),

        request(
          "/rest/v1/field_clients?select=id,client_name"
        ),

        request(
          "/rest/v1/field_projects?select=id,project_name"
        ),

        request(
          "/rest/v1/field_sites?select=id,site_name"
        ),

        request(
          "/rest/v1/field_job_assignments?select=job_id,assignment_type,resource_id"
        ),

        request(
          "/rest/v1/employees?select=id,employee_name,employee_first_name,employee_last_name"
        )
      ]);

      let workOrders = [];

      try {
        const rawValue = appState?.[0]?.storage_value || "[]";
        const parsedValue = JSON.parse(rawValue);

        workOrders = Array.isArray(parsedValue)
          ? parsedValue
          : parsedValue?.workOrders || [];
      } catch (error) {
        console.warn("Unable to parse laboratory WIP data.", error);
      }

      renderWorkOrders(workOrders);

      renderFieldSchedule({
        jobs: jobs || [],
        clients: clients || [],
        projects: projects || [],
        sites: sites || [],
        assignments: assignments || [],
        employees: employees || []
      });

      byId("sync-status").textContent = "Connected";
      byId("sync-dot").className = "connected";

      byId("last-sync").textContent =
        `Last updated ${new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit"
        })}`;
    } catch (error) {
      console.error("Live dashboard refresh failed:", error);

      byId("sync-status").textContent = "Connection issue";
      byId("sync-dot").className = "error";
      byId("last-sync").textContent = "Retrying automatically";
    } finally {
      refreshInProgress = false;
    }
  }

  updateClock();

  setInterval(updateClock, 1000);

  refreshDashboard();

  setInterval(refreshDashboard, REFRESH_INTERVAL);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      refreshDashboard();
    }
  });
})();