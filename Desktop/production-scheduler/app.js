let jobs = [];
let currentEditId = null;
const productionStages = ["art", "print", "diecut", "rewind", "finished"];
const statusColors = {
  art: "#9d5cff",
  print: "#4a9cff",
  diecut: "#6dff7a",
  rewind: "#ffd84a",
  finished: "#a0a0a0",
};

function initCalendar() {
  const calendarColumns = document.querySelector(".calendar-columns");
  calendarColumns.innerHTML = "";

  const today = new Date();
  const startDate = new Date(today);

  // Calculate Monday of current week
  const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Days to subtract to reach Monday
  startDate.setDate(today.getDate() - diff);

  // If Saturday (6) or Sunday (0), show next week
  if (today.getDay() === 6 || today.getDay() === 0) {
    startDate.setDate(startDate.getDate() + 7);
  }

  // Create 5 weekday columns
  for (let i = 0; i < 5; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    const dayColumn = document.createElement("div");
    dayColumn.className = "day-column";
    dayColumn.dataset.date = date.toISOString().split("T")[0];
    dayColumn.innerHTML = `
      <div class="date-header">${date.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
      })}</div>
      <div class="jobs" data-date="${date.toISOString().split("T")[0]}"></div>
    `;
    calendarColumns.appendChild(dayColumn);
  }
  addDnDHandlers();
}

let draggedJobId = null;

function addDnDHandlers() {
  document.querySelectorAll(".job-card").forEach((card) => {
    card.draggable = true;
    card.addEventListener("dragstart", handleDragStart);
    card.addEventListener("dragend", handleDragEnd);
  });

  document.querySelectorAll(".day-column, #jobsPool").forEach((zone) => {
    zone.addEventListener("dragover", handleDragOver);
    zone.addEventListener("drop", handleDrop);
  });
}

function handleDragStart(e) {
  draggedJobId = this.dataset.jobId;
  this.classList.add("dragging");
}

function handleDragEnd(e) {
  this.classList.remove("dragging");
  draggedJobId = null;
}

function handleDragOver(e) {
  e.preventDefault();
}

function handleDrop(e) {
  e.preventDefault();
  const job = jobs.find((j) => j.id === draggedJobId);
  const target = e.target.closest(".day-column, #jobsPool");

  if (job && target) {
    if (target.classList.contains("day-column")) {
      job.dueDate = target.dataset.date;
    } else {
      delete job.dueDate;
    }
    renderJobs();
  }
}

function createJobElement(job) {
  const jobElement = document.createElement("div");
  jobElement.className = `job-card ${job.status} ${job.rush ? "rush" : ""}`;
  jobElement.dataset.jobId = job.id;
  jobElement.innerHTML = `
    <div class="controls">
      <button class="warning" onclick="deleteJob('${job.id}')">✕</button>
      <button onclick="editJob('${job.id}')">✎</button>
    </div>
    <span class="company">${job.company}</span>
    <span class="job-title">${job.title}</span>
    <div class="size-label">Size: ${job.size}</div>
    <div class="job-details">
      <span>Labels: ${job.labels}</span>
      <div class="status-control">
        <span class="status-indicator" style="background: ${
          statusColors[job.status]
        }"></span>
        <span>${job.status}</span>
        <button class="primary progress-button" ${
          job.status === "finished" ? "disabled" : ""
        }>
          ${job.status === "finished" ? "Complete" : "Advance"}
        </button>
      </div>
    </div>
    ${job.notes ? `<div class="notes">${job.notes}</div>` : ""}
  `;
  jobElement
    .querySelector(".progress-button")
    .addEventListener("click", () => advanceJob(job.id));
  return jobElement;
}

function renderJobs() {
  const pool = document.getElementById("jobsPool");
  const calendarColumns = document.querySelectorAll(".jobs");

  pool.innerHTML = "";
  calendarColumns.forEach((col) => (col.innerHTML = ""));

  jobs.forEach((job) => {
    const jobElement = createJobElement(job);
    if (job.dueDate) {
      const container = document.querySelector(
        `.jobs[data-date="${job.dueDate}"]`
      );
      if (container) container.appendChild(jobElement);
    } else {
      pool.appendChild(jobElement);
    }
  });

  addDnDHandlers();
}

function addJob(job) {
  jobs.push({
    ...job,
    id: crypto.randomUUID(), // ← Browser's built-in UUID generator
  });
  renderJobs();
}

function updateJob(updatedJob) {
  jobs = jobs.map((job) => (job.id === updatedJob.id ? updatedJob : job));
  renderJobs();
}

function deleteJob(id) {
  {
    jobs = jobs.filter((job) => job.id !== id);
    renderJobs();
  }
}

function editJob(id) {
  const job = jobs.find((job) => job.id === id);
  if (!job) return;

  currentEditId = id;
  document.getElementById("formTitle").textContent = "✎ Edit Job";
  document.getElementById("submitBtn").textContent = "Update Job";
  document.getElementById("cancelEdit").style.display = "inline-block";

  document.getElementById("company").value = job.company;
  document.getElementById("title").value = job.title;
  document.getElementById("labels").value = job.labels;
  document.getElementById("size").value = job.size;
  document.getElementById("status").value = job.status;
  document.getElementById("rush").checked = job.rush;
  document.getElementById("notes").value = job.notes;
}

function advanceJob(id) {
  const job = jobs.find((job) => job.id === id);
  const currentIndex = productionStages.indexOf(job.status);

  if (currentIndex < productionStages.length - 1) {
    job.status = productionStages[currentIndex + 1];
    updateJob(job);
  }
}

document.getElementById("jobForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const jobData = {
    id: currentEditId || Date.now().toString(),
    company: document.getElementById("company").value,
    title: document.getElementById("title").value,
    labels: document.getElementById("labels").value,
    size: document.getElementById("size").value,
    status: document.getElementById("status").value,
    rush: document.getElementById("rush").checked,
    notes: document.getElementById("notes").value,
  };

  if (currentEditId) {
    updateJob(jobData);
  } else {
    addJob(jobData);
  }

  this.reset();
  currentEditId = null;
  document.getElementById("formTitle").textContent = "➕ Add New Job";
  document.getElementById("submitBtn").textContent = "Add Job";
  document.getElementById("cancelEdit").style.display = "none";
});

document.getElementById("cancelEdit").addEventListener("click", () => {
  document.getElementById("jobForm").reset();
  currentEditId = null;
  document.getElementById("formTitle").textContent = "➕ Add New Job";
  document.getElementById("submitBtn").textContent = "Add Job";
  document.getElementById("cancelEdit").style.display = "none";
});

initCalendar();
addJob({
  company: "Tech Corp",
  title: "Safety Labels",
  labels: 500,
  size: "4x6",
  status: "art",
  rush: false,
  notes: "Fire-resistant material required",
});

addJob({
  company: "Fast Logistics",
  title: "Shipping Labels",
  labels: 1200,
  size: "8x10",
  status: "print",
  rush: true,
  notes: "Priority overnight shipping",
});
