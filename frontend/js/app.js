// ============================================================
//  SLMS – Student Learning Management System
//  JavaScript replica of the Java backend (in-memory)
// ============================================================

// ── LRU Cache (mirrors CacheAPI.java) ───────────────────────
class LruMap {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.map = new Map();
  }
  get(key) {
    if (!this.map.has(key)) return null;
    const val = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }
  set(key, val) {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.maxSize) {
      this.map.delete(this.map.keys().next().value); // evict eldest
    }
    this.map.set(key, val);
  }
  delete(key) { this.map.delete(key); }
  entries() { return [...this.map.entries()]; }
  size() { return this.map.size; }
}

class CacheAPI {
  static FIELD_STUDENT_ID   = 'studentId';
  static FIELD_STUDENT_NAME = 'studentName';
  static FIELD_COURSE_CODE  = 'courseCode';
  static FIELD_COURSE_NAME  = 'courseName';
  static TYPE_STUDENT = 'student';
  static TYPE_COURSE  = 'course';

  constructor() {
    this.inputHistory   = new Map(); // field → LruMap<value, timestamp>
    this.searchCache    = new Map(); // type  → LruMap<key, summary>
    for (const f of [CacheAPI.FIELD_STUDENT_ID, CacheAPI.FIELD_STUDENT_NAME,
                     CacheAPI.FIELD_COURSE_CODE, CacheAPI.FIELD_COURSE_NAME]) {
      this.inputHistory.set(f, new LruMap(10));
    }
    for (const t of [CacheAPI.TYPE_STUDENT, CacheAPI.TYPE_COURSE]) {
      this.searchCache.set(t, new LruMap(5));
    }
  }

  recordInput(field, value) {
    if (value && value.trim()) this.inputHistory.get(field)?.set(value.trim(), Date.now());
  }

  getSuggestions(field) {
    const lru = this.inputHistory.get(field);
    if (!lru) return [];
    return lru.entries().reverse().map(([k]) => k);
  }

  cacheSearchResult(type, key, summary) {
    this.searchCache.get(type)?.set(key, summary);
  }

  getCachedResult(type, key) {
    return this.searchCache.get(type)?.get(key) ?? null;
  }

  evict(type, key) {
    this.searchCache.get(type)?.delete(key);
  }

  getStatus() {
    const out = [];
    for (const [field, lru] of this.inputHistory) {
      out.push({ section: `Input History — ${field}`, entries: lru.entries().map(([k, v]) => ({ key: k, val: new Date(v).toLocaleTimeString() })) });
    }
    for (const [type, lru] of this.searchCache) {
      out.push({ section: `Search Cache — ${type}`, entries: lru.entries().map(([k, v]) => ({ key: k, val: v })) });
    }
    return out;
  }
}

// ── Student model (mirrors Student.java) ────────────────────
class Student {
  constructor(firstName, lastName, studentId, email, phoneNumber) {
    this.firstName   = firstName;
    this.lastName    = lastName;
    this.studentId   = studentId;
    this.email       = email;
    this.phoneNumber = phoneNumber;
  }
  get studentName() { return `${this.firstName} ${this.lastName}`.trim(); }
}

// ── Course model (mirrors Course.java) ──────────────────────
class Course {
  constructor(courseName, courseCode, creditHour, courseSummary, msTeamsLink, courseType = 'core') {
    this.courseName    = courseName;
    this.courseCode    = courseCode;
    this.courseType    = this._normalize(courseType);
    this.creditHour    = creditHour;
    this.courseSummary = courseSummary;
    this.msTeamsLink   = msTeamsLink;
  }
  _normalize(v) {
    const n = (v || '').trim().toLowerCase();
    return ['core', 'elective', 'university'].includes(n) ? n : 'core';
  }
}

// ── Application State ────────────────────────────────────────
const MAX_STUDENTS = 100;
const MAX_COURSES  = 100;

const state = {
  students:    [],   // Student[]
  courses:     [],   // Course[]
  enrollments: {},   // courseCode → Set<studentId>
  cache:       new CacheAPI(),
};

// ── Student Operations ───────────────────────────────────────
const StudentOps = {
  add(firstName, lastName, studentId, email, phoneNumber) {
    if (state.students.length >= MAX_STUDENTS) return { ok: false, msg: 'Storage full (100 students).' };
    if (state.students.find(s => s.studentId.toLowerCase() === studentId.toLowerCase()))
      return { ok: false, msg: `Student ID '${studentId}' already exists.` };
    const s = new Student(firstName, lastName, studentId, email, phoneNumber);
    state.students.push(s);
    state.cache.recordInput(CacheAPI.FIELD_STUDENT_ID,   studentId);
    state.cache.recordInput(CacheAPI.FIELD_STUDENT_NAME, s.studentName);
    state.cache.cacheSearchResult(CacheAPI.TYPE_STUDENT, studentId, `${studentId} – ${s.studentName}`);
    return { ok: true, msg: `Student '${s.studentName}' added successfully.` };
  },

  getAll() { return [...state.students]; },

  findById(id) { return state.students.find(s => s.studentId.toLowerCase() === id.toLowerCase()) ?? null; },

  search(query) {
    const q = query.toLowerCase();
    return state.students.filter(s =>
      s.studentId.toLowerCase().includes(q) ||
      s.studentName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  },

  edit(studentId, updates) {
    const s = this.findById(studentId);
    if (!s) return { ok: false, msg: 'Student not found.' };
    if (updates.firstName)   s.firstName   = updates.firstName;
    if (updates.lastName)    s.lastName    = updates.lastName;
    if (updates.email)       s.email       = updates.email;
    if (updates.phoneNumber) s.phoneNumber = updates.phoneNumber;
    state.cache.recordInput(CacheAPI.FIELD_STUDENT_NAME, s.studentName);
    state.cache.cacheSearchResult(CacheAPI.TYPE_STUDENT, studentId, `${studentId} – ${s.studentName}`);
    return { ok: true, msg: `Student '${s.studentName}' updated.` };
  },

  delete(studentId) {
    const idx = state.students.findIndex(s => s.studentId.toLowerCase() === studentId.toLowerCase());
    if (idx === -1) return { ok: false, msg: 'Student not found.' };
    const name = state.students[idx].studentName;
    state.students.splice(idx, 1);
    // remove enrollments
    for (const set of Object.values(state.enrollments)) set.delete(studentId.toLowerCase());
    state.cache.evict(CacheAPI.TYPE_STUDENT, studentId);
    return { ok: true, msg: `Student '${name}' deleted.` };
  }
};

// ── Course Operations ────────────────────────────────────────
const CourseOps = {
  add(courseName, courseCode, creditHour, courseSummary, msTeamsLink, courseType) {
    if (state.courses.length >= MAX_COURSES) return { ok: false, msg: 'Storage full (100 courses).' };
    if (state.courses.find(c => c.courseCode.toLowerCase() === courseCode.toLowerCase()))
      return { ok: false, msg: `Course code '${courseCode}' already exists.` };
    const c = new Course(courseName, courseCode, parseInt(creditHour) || 0, courseSummary, msTeamsLink, courseType);
    state.courses.push(c);
    state.enrollments[courseCode.toLowerCase()] = new Set();
    state.cache.recordInput(CacheAPI.FIELD_COURSE_CODE, courseCode);
    state.cache.recordInput(CacheAPI.FIELD_COURSE_NAME, courseName);
    state.cache.cacheSearchResult(CacheAPI.TYPE_COURSE, courseCode, `${courseCode} – ${courseName}`);
    return { ok: true, msg: `Course '${courseName}' added.` };
  },

  getAll() { return [...state.courses]; },

  findByCode(code) { return state.courses.find(c => c.courseCode.toLowerCase() === code.toLowerCase()) ?? null; },

  search(query) {
    const q = query.toLowerCase();
    return state.courses.filter(c =>
      c.courseCode.toLowerCase().includes(q) ||
      c.courseName.toLowerCase().includes(q) ||
      c.courseType.toLowerCase().includes(q)
    );
  },

  edit(courseCode, updates) {
    const c = this.findByCode(courseCode);
    if (!c) return { ok: false, msg: 'Course not found.' };
    if (updates.courseName)    { c.courseName = updates.courseName; state.cache.recordInput(CacheAPI.FIELD_COURSE_NAME, updates.courseName); }
    if (updates.courseType)    c.courseType    = c._normalize(updates.courseType);
    if (updates.creditHour !== undefined) c.creditHour = parseInt(updates.creditHour) || 0;
    if (updates.courseSummary) c.courseSummary = updates.courseSummary;
    if (updates.msTeamsLink)   c.msTeamsLink   = updates.msTeamsLink;
    state.cache.cacheSearchResult(CacheAPI.TYPE_COURSE, courseCode, `${courseCode} – ${c.courseName}`);
    return { ok: true, msg: `Course '${c.courseName}' updated.` };
  },

  delete(courseCode) {
    const idx = state.courses.findIndex(c => c.courseCode.toLowerCase() === courseCode.toLowerCase());
    if (idx === -1) return { ok: false, msg: 'Course not found.' };
    const name = state.courses[idx].courseName;
    state.courses.splice(idx, 1);
    delete state.enrollments[courseCode.toLowerCase()];
    state.cache.evict(CacheAPI.TYPE_COURSE, courseCode);
    return { ok: true, msg: `Course '${name}' deleted.` };
  }
};

// ── Enrollment Operations ────────────────────────────────────
const EnrollmentOps = {
  enroll(courseCode, studentId) {
    const course   = CourseOps.findByCode(courseCode);
    const student  = StudentOps.findById(studentId);
    if (!course)   return { ok: false, msg: `Course '${courseCode}' not found.` };
    if (!student)  return { ok: false, msg: `Student '${studentId}' not found.` };
    const key = courseCode.toLowerCase();
    if (!state.enrollments[key]) state.enrollments[key] = new Set();
    if (state.enrollments[key].has(studentId.toLowerCase()))
      return { ok: false, msg: `'${student.studentName}' is already enrolled in '${course.courseName}'.` };
    state.enrollments[key].add(studentId.toLowerCase());
    state.cache.cacheSearchResult(CacheAPI.TYPE_COURSE,  courseCode, `${courseCode} – ${course.courseName}`);
    state.cache.cacheSearchResult(CacheAPI.TYPE_STUDENT, studentId,  `${studentId} – ${student.studentName}`);
    return { ok: true, msg: `Enrolled '${student.studentName}' in '${course.courseName}'.` };
  },

  unenroll(courseCode, studentId) {
    const key = courseCode.toLowerCase();
    if (!state.enrollments[key] || !state.enrollments[key].has(studentId.toLowerCase()))
      return { ok: false, msg: 'Enrollment not found.' };
    state.enrollments[key].delete(studentId.toLowerCase());
    return { ok: true, msg: 'Enrollment removed.' };
  },

  getStudentsInCourse(courseCode) {
    const set = state.enrollments[courseCode.toLowerCase()];
    if (!set) return [];
    return [...set].map(id => StudentOps.findById(id)).filter(Boolean);
  },

  getCoursesForStudent(studentId) {
    return state.courses.filter(c =>
      (state.enrollments[c.courseCode.toLowerCase()] || new Set()).has(studentId.toLowerCase())
    );
  },

  isEnrolled(courseCode, studentId) {
    return !!(state.enrollments[courseCode.toLowerCase()]?.has(studentId.toLowerCase()));
  },

  getEnrollmentCount(courseCode) {
    return state.enrollments[courseCode.toLowerCase()]?.size ?? 0;
  }
};

// ── Toast Notification ───────────────────────────────────────
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const id = `toast-${Date.now()}`;
  const icons = { success: 'check-circle-fill', danger: 'x-circle-fill', warning: 'exclamation-triangle-fill', info: 'info-circle-fill' };
  const html = `
    <div id="${id}" class="toast align-items-center text-bg-${type} border-0 mb-2" role="alert" aria-live="assertive">
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi bi-${icons[type] || 'info-circle-fill'} me-2"></i>${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>`;
  container.insertAdjacentHTML('beforeend', html);
  const el = document.getElementById(id);
  const toast = new bootstrap.Toast(el, { delay: 4000 });
  toast.show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}

// ── Page Rendering ───────────────────────────────────────────
let currentPage = 'dashboard';
let editTarget  = null;

function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item .nav-link').forEach(l => l.classList.remove('active'));
  const link = document.querySelector(`[data-page="${page}"]`);
  if (link) link.classList.add('active');
  renderPage(page);
  // close sidebar on mobile
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth < 768) sidebar.classList.add('d-none');
}

function renderPage(page) {
  const content = document.getElementById('mainContent');
  switch (page) {
    case 'dashboard':    content.innerHTML = renderDashboard();   break;
    case 'students':     content.innerHTML = renderStudents();    bindStudentEvents();   break;
    case 'courses':      content.innerHTML = renderCourses();     bindCourseEvents();    break;
    case 'enrollment':   content.innerHTML = renderEnrollment();  bindEnrollmentEvents(); break;
    case 'cache':        content.innerHTML = renderCache();       break;
    default:             content.innerHTML = renderDashboard();
  }
}

// ── Dashboard ────────────────────────────────────────────────
function renderDashboard() {
  const totalStudents   = state.students.length;
  const totalCourses    = state.courses.length;
  const totalEnrollments = state.courses.reduce((acc, c) => acc + EnrollmentOps.getEnrollmentCount(c.courseCode), 0);
  const recentStudents  = state.students.slice(-3).reverse();
  const recentCourses   = state.courses.slice(-3).reverse();

  return `
    <div class="breadcrumb-bar mb-3">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-0">
          <li class="breadcrumb-item"><a href="#" onclick="navigate('dashboard')">Dashboard</a></li>
        </ol>
      </nav>
    </div>

    <div class="page-header mb-4">
      <h2 class="fw-bold mb-1"><i class="bi bi-speedometer2 me-2 text-moodle"></i>Dashboard</h2>
      <p class="text-muted mb-0">Welcome back to the Student Learning Management System</p>
    </div>

    <!-- Stats Cards -->
    <div class="row g-3 mb-4">
      <div class="col-sm-6 col-xl-4">
        <div class="stat-card card border-0 shadow-sm h-100">
          <div class="card-body d-flex align-items-center gap-3 p-4">
            <div class="stat-icon bg-primary-subtle rounded-3 p-3">
              <i class="bi bi-people-fill fs-3 text-primary"></i>
            </div>
            <div>
              <div class="stat-number fw-bold fs-2">${totalStudents}</div>
              <div class="text-muted small">Total Students</div>
              <div class="text-muted small">Max: ${MAX_STUDENTS}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-xl-4">
        <div class="stat-card card border-0 shadow-sm h-100">
          <div class="card-body d-flex align-items-center gap-3 p-4">
            <div class="stat-icon bg-success-subtle rounded-3 p-3">
              <i class="bi bi-journal-bookmark-fill fs-3 text-success"></i>
            </div>
            <div>
              <div class="stat-number fw-bold fs-2">${totalCourses}</div>
              <div class="text-muted small">Total Courses</div>
              <div class="text-muted small">Max: ${MAX_COURSES}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-xl-4">
        <div class="stat-card card border-0 shadow-sm h-100">
          <div class="card-body d-flex align-items-center gap-3 p-4">
            <div class="stat-icon bg-warning-subtle rounded-3 p-3">
              <i class="bi bi-link-45deg fs-3 text-warning"></i>
            </div>
            <div>
              <div class="stat-number fw-bold fs-2">${totalEnrollments}</div>
              <div class="text-muted small">Enrollments</div>
              <div class="text-muted small">Active links</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Course Cards (Moodle-style) -->
    <div class="row g-3">
      <div class="col-lg-8">
        <div class="card border-0 shadow-sm mb-3">
          <div class="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3">
            <h5 class="mb-0 fw-semibold"><i class="bi bi-journal-bookmark me-2 text-moodle"></i>Course Overview</h5>
            <button class="btn btn-sm btn-moodle" onclick="navigate('courses')">View All</button>
          </div>
          <div class="card-body p-3">
            ${totalCourses === 0 ? `
              <div class="text-center py-4 text-muted">
                <i class="bi bi-journal-x fs-1 d-block mb-2"></i>
                No courses yet. <a href="#" onclick="navigate('courses')">Add your first course →</a>
              </div>
            ` : `
              <div class="row g-3">
                ${state.courses.slice(0, 6).map(c => `
                  <div class="col-sm-6">
                    <div class="course-card card border-0 h-100" style="border-left: 4px solid var(--moodle-orange) !important;">
                      <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                          <span class="badge ${courseTypeBadge(c.courseType)} rounded-pill">${c.courseType}</span>
                          <span class="text-muted small">${c.creditHour} cr</span>
                        </div>
                        <h6 class="fw-bold mb-1">${escHtml(c.courseName)}</h6>
                        <div class="text-muted small mb-2"><code>${escHtml(c.courseCode)}</code></div>
                        <p class="text-muted small mb-2 text-truncate">${escHtml(c.courseSummary)}</p>
                        <div class="d-flex align-items-center gap-2">
                          <i class="bi bi-people text-moodle"></i>
                          <span class="small">${EnrollmentOps.getEnrollmentCount(c.courseCode)} student(s)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      </div>

      <div class="col-lg-4">
        <!-- Recent Students -->
        <div class="card border-0 shadow-sm mb-3">
          <div class="card-header bg-white border-bottom py-3">
            <h6 class="mb-0 fw-semibold"><i class="bi bi-person-lines-fill me-2 text-moodle"></i>Recent Students</h6>
          </div>
          <div class="card-body p-0">
            ${recentStudents.length === 0 ? `<div class="text-center py-3 text-muted small">No students yet</div>` :
              recentStudents.map(s => `
                <div class="d-flex align-items-center gap-3 p-3 border-bottom">
                  <div class="avatar-circle bg-primary-subtle text-primary fw-bold">
                    ${s.firstName.charAt(0)}${s.lastName.charAt(0) || ''}
                  </div>
                  <div class="overflow-hidden">
                    <div class="fw-semibold small text-truncate">${escHtml(s.studentName)}</div>
                    <div class="text-muted x-small">${escHtml(s.studentId)}</div>
                  </div>
                </div>
              `).join('')
            }
            <div class="p-2 text-center">
              <a href="#" class="small text-moodle" onclick="navigate('students')">Manage Students →</a>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-bottom py-3">
            <h6 class="mb-0 fw-semibold"><i class="bi bi-lightning-fill me-2 text-warning"></i>Quick Actions</h6>
          </div>
          <div class="card-body d-grid gap-2 p-3">
            <button class="btn btn-outline-moodle btn-sm" onclick="navigate('students'); setTimeout(()=>document.getElementById('addStudentBtn')?.click(),200)">
              <i class="bi bi-person-plus me-2"></i>Add Student
            </button>
            <button class="btn btn-outline-moodle btn-sm" onclick="navigate('courses'); setTimeout(()=>document.getElementById('addCourseBtn')?.click(),200)">
              <i class="bi bi-journal-plus me-2"></i>Add Course
            </button>
            <button class="btn btn-outline-moodle btn-sm" onclick="navigate('enrollment')">
              <i class="bi bi-link-45deg me-2"></i>Enroll Student
            </button>
            <button class="btn btn-outline-secondary btn-sm" onclick="navigate('cache')">
              <i class="bi bi-database me-2"></i>View Cache Status
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

// ── Students Page ────────────────────────────────────────────
function renderStudents(filter = '') {
  const students = filter ? StudentOps.search(filter) : StudentOps.getAll();
  return `
    <div class="breadcrumb-bar mb-3">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-0">
          <li class="breadcrumb-item"><a href="#" onclick="navigate('dashboard')">Dashboard</a></li>
          <li class="breadcrumb-item active">Student Management</li>
        </ol>
      </nav>
    </div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h2 class="fw-bold mb-0"><i class="bi bi-people-fill me-2 text-moodle"></i>Student Management</h2>
      <button class="btn btn-moodle" id="addStudentBtn" data-bs-toggle="modal" data-bs-target="#studentModal" onclick="openAddStudent()">
        <i class="bi bi-person-plus me-1"></i>Add Student
      </button>
    </div>
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white border-bottom py-3 d-flex gap-2 flex-wrap">
        <div class="input-group" style="max-width:320px;">
          <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
          <input type="text" class="form-control border-start-0" id="studentSearch" placeholder="Search by name, ID, email…" value="${escHtml(filter)}" oninput="filterStudents(this.value)">
        </div>
        <span class="badge bg-secondary-subtle text-secondary rounded-pill align-self-center">${students.length} student(s)</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0 align-middle">
            <thead class="table-light">
              <tr>
                <th class="ps-4">#</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Courses</th>
                <th class="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${students.length === 0 ? `
                <tr><td colspan="7" class="text-center py-5 text-muted">
                  <i class="bi bi-person-x fs-1 d-block mb-2"></i>
                  ${filter ? 'No students match your search.' : 'No students yet. Add your first student!'}
                </td></tr>
              ` : students.map((s, i) => `
                <tr>
                  <td class="ps-4 text-muted small">${i + 1}</td>
                  <td><code class="text-moodle fw-semibold">${escHtml(s.studentId)}</code></td>
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <div class="avatar-circle bg-primary-subtle text-primary fw-bold flex-shrink-0">
                        ${s.firstName.charAt(0)}${s.lastName.charAt(0) || ''}
                      </div>
                      <div>
                        <div class="fw-semibold">${escHtml(s.studentName)}</div>
                      </div>
                    </div>
                  </td>
                  <td class="text-muted small">${escHtml(s.email)}</td>
                  <td class="text-muted small">${escHtml(s.phoneNumber)}</td>
                  <td><span class="badge bg-info-subtle text-info rounded-pill">${EnrollmentOps.getCoursesForStudent(s.studentId).length} course(s)</span></td>
                  <td class="text-end pe-4">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditStudent('${escHtml(s.studentId)}')" title="Edit">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="confirmDeleteStudent('${escHtml(s.studentId)}')" title="Delete">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Student Modal -->
    <div class="modal fade" id="studentModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-moodle text-white">
            <h5 class="modal-title" id="studentModalTitle"><i class="bi bi-person-plus me-2"></i>Add Student</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <form id="studentForm" novalidate>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label fw-semibold">First Name <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="sfFirstName" placeholder="e.g. Ahmad" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Last Name <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="sfLastName" placeholder="e.g. Razali" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Student ID <span class="text-danger">*</span></label>
                  <input type="text" class="form-control font-monospace" id="sfStudentId" placeholder="e.g. S001" required>
                  <div class="form-text" id="sfIdHint"></div>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Phone Number <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="sfPhone" placeholder="e.g. 0123456789" required>
                </div>
                <div class="col-12">
                  <label class="form-label fw-semibold">Email Address <span class="text-danger">*</span></label>
                  <input type="email" class="form-control" id="sfEmail" placeholder="e.g. ahmad@university.edu.my" required>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button class="btn btn-moodle" id="studentSaveBtn" onclick="saveStudent()">
              <i class="bi bi-check-lg me-1"></i>Save Student
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <div class="modal fade" id="deleteStudentModal" tabindex="-1">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title"><i class="bi bi-exclamation-triangle me-2"></i>Confirm Delete</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" id="deleteStudentBody">Are you sure?</div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
            <button class="btn btn-danger btn-sm" id="confirmDeleteStudentBtn">Delete</button>
          </div>
        </div>
      </div>
    </div>`;
}

function bindStudentEvents() {
  // Suggestions for student ID
  const sfId = document.getElementById('sfStudentId');
  const hint = document.getElementById('sfIdHint');
  if (sfId) {
    sfId.addEventListener('focus', () => {
      const sugg = state.cache.getSuggestions(CacheAPI.FIELD_STUDENT_ID);
      if (hint && sugg.length) hint.textContent = `Recent: ${sugg.slice(0,3).join(', ')}`;
    });
  }
}

function filterStudents(query) {
  document.getElementById('mainContent').innerHTML = renderStudents(query);
  bindStudentEvents();
  document.getElementById('studentSearch')?.focus();
}

function openAddStudent() {
  editTarget = null;
  document.getElementById('studentModalTitle').innerHTML = '<i class="bi bi-person-plus me-2"></i>Add Student';
  document.getElementById('sfFirstName').value = '';
  document.getElementById('sfLastName').value  = '';
  document.getElementById('sfStudentId').value = '';
  document.getElementById('sfEmail').value     = '';
  document.getElementById('sfPhone').value     = '';
  document.getElementById('sfStudentId').disabled = false;
}

function openEditStudent(studentId) {
  const s = StudentOps.findById(studentId);
  if (!s) return;
  editTarget = studentId;
  document.getElementById('studentModalTitle').innerHTML = '<i class="bi bi-pencil me-2"></i>Edit Student';
  document.getElementById('sfFirstName').value = s.firstName;
  document.getElementById('sfLastName').value  = s.lastName;
  document.getElementById('sfStudentId').value = s.studentId;
  document.getElementById('sfEmail').value     = s.email;
  document.getElementById('sfPhone').value     = s.phoneNumber;
  document.getElementById('sfStudentId').disabled = true;
  new bootstrap.Modal(document.getElementById('studentModal')).show();
}

function saveStudent() {
  const fn  = document.getElementById('sfFirstName').value.trim();
  const ln  = document.getElementById('sfLastName').value.trim();
  const id  = document.getElementById('sfStudentId').value.trim();
  const em  = document.getElementById('sfEmail').value.trim();
  const ph  = document.getElementById('sfPhone').value.trim();
  if (!fn || !ln || !em || !ph || (!editTarget && !id)) {
    showToast('Please fill in all required fields.', 'warning'); return;
  }
  let result;
  if (editTarget) {
    result = StudentOps.edit(editTarget, { firstName: fn, lastName: ln, email: em, phoneNumber: ph });
  } else {
    result = StudentOps.add(fn, ln, id, em, ph);
  }
  if (result.ok) {
    bootstrap.Modal.getInstance(document.getElementById('studentModal'))?.hide();
    renderPage('students');
    bindStudentEvents();
    showToast(result.msg, 'success');
  } else {
    showToast(result.msg, 'danger');
  }
}

function confirmDeleteStudent(studentId) {
  const s = StudentOps.findById(studentId);
  if (!s) return;
  document.getElementById('deleteStudentBody').innerHTML =
    `Delete student <strong>${escHtml(s.studentName)}</strong> (<code>${escHtml(s.studentId)}</code>)?<br>
     <small class="text-muted">This will also remove all enrollments.</small>`;
  document.getElementById('confirmDeleteStudentBtn').onclick = () => {
    const result = StudentOps.delete(studentId);
    bootstrap.Modal.getInstance(document.getElementById('deleteStudentModal'))?.hide();
    renderPage('students');
    bindStudentEvents();
    showToast(result.msg, result.ok ? 'success' : 'danger');
  };
  new bootstrap.Modal(document.getElementById('deleteStudentModal')).show();
}

// ── Courses Page ─────────────────────────────────────────────
function renderCourses(filter = '') {
  const courses = filter ? CourseOps.search(filter) : CourseOps.getAll();
  return `
    <div class="breadcrumb-bar mb-3">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-0">
          <li class="breadcrumb-item"><a href="#" onclick="navigate('dashboard')">Dashboard</a></li>
          <li class="breadcrumb-item active">Course Management</li>
        </ol>
      </nav>
    </div>
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h2 class="fw-bold mb-0"><i class="bi bi-journal-bookmark-fill me-2 text-moodle"></i>Course Management</h2>
      <button class="btn btn-moodle" id="addCourseBtn" data-bs-toggle="modal" data-bs-target="#courseModal" onclick="openAddCourse()">
        <i class="bi bi-journal-plus me-1"></i>Add Course
      </button>
    </div>
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white border-bottom py-3 d-flex gap-2 flex-wrap">
        <div class="input-group" style="max-width:320px;">
          <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
          <input type="text" class="form-control border-start-0" id="courseSearch" placeholder="Search by name, code, type…" value="${escHtml(filter)}" oninput="filterCourses(this.value)">
        </div>
        <span class="badge bg-secondary-subtle text-secondary rounded-pill align-self-center">${courses.length} course(s)</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0 align-middle">
            <thead class="table-light">
              <tr>
                <th class="ps-4">#</th>
                <th>Code</th>
                <th>Course Name</th>
                <th>Type</th>
                <th>Credits</th>
                <th>Students</th>
                <th>Teams Link</th>
                <th class="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${courses.length === 0 ? `
                <tr><td colspan="8" class="text-center py-5 text-muted">
                  <i class="bi bi-journal-x fs-1 d-block mb-2"></i>
                  ${filter ? 'No courses match your search.' : 'No courses yet. Add your first course!'}
                </td></tr>
              ` : courses.map((c, i) => `
                <tr>
                  <td class="ps-4 text-muted small">${i + 1}</td>
                  <td><code class="text-moodle fw-semibold">${escHtml(c.courseCode)}</code></td>
                  <td>
                    <div class="fw-semibold">${escHtml(c.courseName)}</div>
                    <div class="text-muted x-small text-truncate" style="max-width:200px">${escHtml(c.courseSummary)}</div>
                  </td>
                  <td><span class="badge ${courseTypeBadge(c.courseType)} rounded-pill">${c.courseType}</span></td>
                  <td class="text-center"><span class="badge bg-light text-dark border">${c.creditHour}</span></td>
                  <td><span class="badge bg-info-subtle text-info rounded-pill">${EnrollmentOps.getEnrollmentCount(c.courseCode)}</span></td>
                  <td>
                    ${c.msTeamsLink ? `<a href="${escHtml(c.msTeamsLink)}" target="_blank" class="btn btn-sm btn-outline-primary py-0 px-2">
                      <i class="bi bi-microsoft-teams me-1"></i>Join
                    </a>` : '<span class="text-muted small">—</span>'}
                  </td>
                  <td class="text-end pe-4">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditCourse('${escHtml(c.courseCode)}')" title="Edit">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="confirmDeleteCourse('${escHtml(c.courseCode)}')" title="Delete">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Course Modal -->
    <div class="modal fade" id="courseModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-moodle text-white">
            <h5 class="modal-title" id="courseModalTitle"><i class="bi bi-journal-plus me-2"></i>Add Course</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <form id="courseForm" novalidate>
              <div class="row g-3">
                <div class="col-md-8">
                  <label class="form-label fw-semibold">Course Name <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="cfName" placeholder="e.g. Data Structures & Algorithms" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-semibold">Course Code <span class="text-danger">*</span></label>
                  <input type="text" class="form-control font-monospace" id="cfCode" placeholder="e.g. CS301" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-semibold">Course Type <span class="text-danger">*</span></label>
                  <select class="form-select" id="cfType">
                    <option value="core">Core</option>
                    <option value="elective">Elective</option>
                    <option value="university">University</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-semibold">Credit Hours <span class="text-danger">*</span></label>
                  <input type="number" class="form-control" id="cfCredit" min="0" max="10" placeholder="3" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-semibold">MS Teams Link</label>
                  <input type="url" class="form-control" id="cfTeams" placeholder="https://teams.microsoft.com/…">
                </div>
                <div class="col-12">
                  <label class="form-label fw-semibold">Course Summary <span class="text-danger">*</span></label>
                  <textarea class="form-control" id="cfSummary" rows="3" placeholder="Brief course description…" required></textarea>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button class="btn btn-moodle" onclick="saveCourse()">
              <i class="bi bi-check-lg me-1"></i>Save Course
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div class="modal fade" id="deleteCourseModal" tabindex="-1">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title"><i class="bi bi-exclamation-triangle me-2"></i>Confirm Delete</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" id="deleteCourseBody">Are you sure?</div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
            <button class="btn btn-danger btn-sm" id="confirmDeleteCourseBtn">Delete</button>
          </div>
        </div>
      </div>
    </div>`;
}

function bindCourseEvents() {}

function filterCourses(query) {
  document.getElementById('mainContent').innerHTML = renderCourses(query);
  document.getElementById('courseSearch')?.focus();
}

function openAddCourse() {
  editTarget = null;
  document.getElementById('courseModalTitle').innerHTML = '<i class="bi bi-journal-plus me-2"></i>Add Course';
  ['cfName','cfCode','cfSummary','cfTeams'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('cfCredit').value = '';
  document.getElementById('cfType').value   = 'core';
  document.getElementById('cfCode').disabled = false;
}

function openEditCourse(courseCode) {
  const c = CourseOps.findByCode(courseCode);
  if (!c) return;
  editTarget = courseCode;
  document.getElementById('courseModalTitle').innerHTML = '<i class="bi bi-pencil me-2"></i>Edit Course';
  document.getElementById('cfName').value    = c.courseName;
  document.getElementById('cfCode').value    = c.courseCode;
  document.getElementById('cfType').value    = c.courseType;
  document.getElementById('cfCredit').value  = c.creditHour;
  document.getElementById('cfSummary').value = c.courseSummary;
  document.getElementById('cfTeams').value   = c.msTeamsLink;
  document.getElementById('cfCode').disabled = true;
  new bootstrap.Modal(document.getElementById('courseModal')).show();
}

function saveCourse() {
  const name    = document.getElementById('cfName').value.trim();
  const code    = document.getElementById('cfCode').value.trim();
  const type    = document.getElementById('cfType').value;
  const credit  = document.getElementById('cfCredit').value;
  const summary = document.getElementById('cfSummary').value.trim();
  const teams   = document.getElementById('cfTeams').value.trim();
  if (!name || !summary || (!editTarget && !code)) {
    showToast('Please fill in all required fields.', 'warning'); return;
  }
  let result;
  if (editTarget) {
    result = CourseOps.edit(editTarget, { courseName: name, courseType: type, creditHour: credit, courseSummary: summary, msTeamsLink: teams });
  } else {
    result = CourseOps.add(name, code, credit, summary, teams, type);
  }
  if (result.ok) {
    bootstrap.Modal.getInstance(document.getElementById('courseModal'))?.hide();
    renderPage('courses');
    showToast(result.msg, 'success');
  } else {
    showToast(result.msg, 'danger');
  }
}

function confirmDeleteCourse(courseCode) {
  const c = CourseOps.findByCode(courseCode);
  if (!c) return;
  const enrolled = EnrollmentOps.getEnrollmentCount(courseCode);
  document.getElementById('deleteCourseBody').innerHTML =
    `Delete course <strong>${escHtml(c.courseName)}</strong> (<code>${escHtml(c.courseCode)}</code>)?
     ${enrolled > 0 ? `<br><small class="text-danger">${enrolled} enrollment(s) will also be removed.</small>` : ''}`;
  document.getElementById('confirmDeleteCourseBtn').onclick = () => {
    const result = CourseOps.delete(courseCode);
    bootstrap.Modal.getInstance(document.getElementById('deleteCourseModal'))?.hide();
    renderPage('courses');
    showToast(result.msg, result.ok ? 'success' : 'danger');
  };
  new bootstrap.Modal(document.getElementById('deleteCourseModal')).show();
}

// ── Enrollment Page ──────────────────────────────────────────
function renderEnrollment() {
  const students = StudentOps.getAll();
  const courses  = CourseOps.getAll();
  return `
    <div class="breadcrumb-bar mb-3">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-0">
          <li class="breadcrumb-item"><a href="#" onclick="navigate('dashboard')">Dashboard</a></li>
          <li class="breadcrumb-item active">Enrollment Management</li>
        </ol>
      </nav>
    </div>
    <h2 class="fw-bold mb-4"><i class="bi bi-link-45deg me-2 text-moodle"></i>Enrollment Management</h2>

    <div class="row g-4">
      <!-- Enroll Form -->
      <div class="col-lg-4">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-moodle text-white py-3">
            <h5 class="mb-0 fw-semibold"><i class="bi bi-person-plus-fill me-2"></i>Enrol Student</h5>
          </div>
          <div class="card-body p-4">
            <div class="mb-3">
              <label class="form-label fw-semibold">Select Course <span class="text-danger">*</span></label>
              <select class="form-select" id="enrollCourse">
                <option value="">— Choose a course —</option>
                ${courses.map(c => `<option value="${escHtml(c.courseCode)}">${escHtml(c.courseCode)} – ${escHtml(c.courseName)}</option>`).join('')}
              </select>
            </div>
            <div class="mb-4">
              <label class="form-label fw-semibold">Select Student <span class="text-danger">*</span></label>
              <select class="form-select" id="enrollStudent">
                <option value="">— Choose a student —</option>
                ${students.map(s => `<option value="${escHtml(s.studentId)}">${escHtml(s.studentId)} – ${escHtml(s.studentName)}</option>`).join('')}
              </select>
            </div>
            <button class="btn btn-moodle w-100" onclick="doEnroll()">
              <i class="bi bi-link-45deg me-1"></i>Enrol Student
            </button>
            ${students.length === 0 || courses.length === 0 ? `
              <div class="alert alert-warning small mt-3 mb-0 py-2">
                <i class="bi bi-exclamation-triangle me-1"></i>
                ${students.length === 0 ? 'Add students first. ' : ''}
                ${courses.length === 0 ? 'Add courses first.' : ''}
              </div>` : ''}
          </div>
        </div>

        <!-- Lookup Tool -->
        <div class="card border-0 shadow-sm mt-4">
          <div class="card-header bg-white border-bottom py-3">
            <h6 class="mb-0 fw-semibold"><i class="bi bi-search me-2 text-moodle"></i>Find Student in Course</h6>
          </div>
          <div class="card-body p-4">
            <div class="mb-3">
              <select class="form-select form-select-sm mb-2" id="lookupCourse">
                <option value="">— Course —</option>
                ${courses.map(c => `<option value="${escHtml(c.courseCode)}">${escHtml(c.courseCode)}</option>`).join('')}
              </select>
              <select class="form-select form-select-sm" id="lookupStudent">
                <option value="">— Student —</option>
                ${students.map(s => `<option value="${escHtml(s.studentId)}">${escHtml(s.studentId)}</option>`).join('')}
              </select>
            </div>
            <button class="btn btn-outline-moodle btn-sm w-100" onclick="doLookup()">
              <i class="bi bi-search me-1"></i>Check Enrollment
            </button>
            <div id="lookupResult" class="mt-3"></div>
          </div>
        </div>
      </div>

      <!-- Course Rosters -->
      <div class="col-lg-8">
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
            <h5 class="mb-0 fw-semibold"><i class="bi bi-people-fill me-2 text-moodle"></i>Course Roster</h5>
            <select class="form-select form-select-sm" style="width:auto;" id="rosterCourseSelect" onchange="renderRoster(this.value)">
              <option value="">— Select a course —</option>
              ${courses.map(c => `<option value="${escHtml(c.courseCode)}">${escHtml(c.courseCode)} – ${escHtml(c.courseName)}</option>`).join('')}
            </select>
          </div>
          <div class="card-body p-3" id="rosterContent">
            <div class="text-center py-4 text-muted"><i class="bi bi-arrow-up-circle me-1"></i>Select a course above</div>
          </div>
        </div>

        <!-- Student Schedule -->
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
            <h5 class="mb-0 fw-semibold"><i class="bi bi-calendar3 me-2 text-moodle"></i>Student Schedule</h5>
            <select class="form-select form-select-sm" style="width:auto;" id="scheduleStudentSelect" onchange="renderSchedule(this.value)">
              <option value="">— Select a student —</option>
              ${students.map(s => `<option value="${escHtml(s.studentId)}">${escHtml(s.studentId)} – ${escHtml(s.studentName)}</option>`).join('')}
            </select>
          </div>
          <div class="card-body p-3" id="scheduleContent">
            <div class="text-center py-4 text-muted"><i class="bi bi-arrow-up-circle me-1"></i>Select a student above</div>
          </div>
        </div>
      </div>
    </div>`;
}

function bindEnrollmentEvents() {}

function doEnroll() {
  const courseCode = document.getElementById('enrollCourse').value;
  const studentId  = document.getElementById('enrollStudent').value;
  if (!courseCode || !studentId) { showToast('Please select both a course and a student.', 'warning'); return; }
  const result = EnrollmentOps.enroll(courseCode, studentId);
  showToast(result.msg, result.ok ? 'success' : 'danger');
  if (result.ok) {
    // Refresh roster if visible
    const rosterSel = document.getElementById('rosterCourseSelect');
    if (rosterSel && rosterSel.value === courseCode) renderRoster(courseCode);
  }
}

function doLookup() {
  const courseCode = document.getElementById('lookupCourse').value;
  const studentId  = document.getElementById('lookupStudent').value;
  const el = document.getElementById('lookupResult');
  if (!courseCode || !studentId) { el.innerHTML = '<div class="alert alert-warning small py-2 mb-0">Select both fields.</div>'; return; }
  const enrolled = EnrollmentOps.isEnrolled(courseCode, studentId);
  const student  = StudentOps.findById(studentId);
  const course   = CourseOps.findByCode(courseCode);
  el.innerHTML = enrolled
    ? `<div class="alert alert-success small py-2 mb-0"><i class="bi bi-check-circle-fill me-1"></i><strong>${escHtml(student?.studentName)}</strong> is enrolled in <strong>${escHtml(course?.courseName)}</strong>.</div>`
    : `<div class="alert alert-secondary small py-2 mb-0"><i class="bi bi-x-circle me-1"></i>Not enrolled.</div>`;
}

function renderRoster(courseCode) {
  const el = document.getElementById('rosterContent');
  if (!courseCode) { el.innerHTML = '<div class="text-center py-4 text-muted">Select a course above</div>'; return; }
  const students = EnrollmentOps.getStudentsInCourse(courseCode);
  const course   = CourseOps.findByCode(courseCode);
  el.innerHTML = students.length === 0
    ? `<div class="text-center py-4 text-muted"><i class="bi bi-people fs-2 d-block mb-2"></i>No students enrolled in <strong>${escHtml(course?.courseName)}</strong> yet.</div>`
    : `<div class="table-responsive">
        <table class="table table-sm table-hover mb-0">
          <thead class="table-light"><tr><th>#</th><th>Student ID</th><th>Name</th><th>Email</th><th>Action</th></tr></thead>
          <tbody>
            ${students.map((s, i) => `
              <tr>
                <td class="text-muted">${i+1}</td>
                <td><code class="text-moodle">${escHtml(s.studentId)}</code></td>
                <td>${escHtml(s.studentName)}</td>
                <td class="text-muted small">${escHtml(s.email)}</td>
                <td>
                  <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="doUnenroll('${escHtml(courseCode)}','${escHtml(s.studentId)}')">
                    <i class="bi bi-x"></i> Remove
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
}

function renderSchedule(studentId) {
  const el = document.getElementById('scheduleContent');
  if (!studentId) { el.innerHTML = '<div class="text-center py-4 text-muted">Select a student above</div>'; return; }
  const courses  = EnrollmentOps.getCoursesForStudent(studentId);
  const student  = StudentOps.findById(studentId);
  el.innerHTML = courses.length === 0
    ? `<div class="text-center py-4 text-muted"><i class="bi bi-calendar-x fs-2 d-block mb-2"></i><strong>${escHtml(student?.studentName)}</strong> is not enrolled in any courses.</div>`
    : `<div class="row g-2">
        ${courses.map(c => `
          <div class="col-sm-6">
            <div class="card border-0 bg-light h-100">
              <div class="card-body p-3">
                <span class="badge ${courseTypeBadge(c.courseType)} rounded-pill mb-1">${c.courseType}</span>
                <h6 class="fw-bold mb-1 mt-1">${escHtml(c.courseName)}</h6>
                <div class="text-muted small"><code>${escHtml(c.courseCode)}</code> · ${c.creditHour} cr</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>`;
}

function doUnenroll(courseCode, studentId) {
  const result = EnrollmentOps.unenroll(courseCode, studentId);
  showToast(result.msg, result.ok ? 'success' : 'danger');
  if (result.ok) renderRoster(courseCode);
}

// ── Cache Status Page ────────────────────────────────────────
function renderCache() {
  const status = state.cache.getStatus();
  return `
    <div class="breadcrumb-bar mb-3">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-0">
          <li class="breadcrumb-item"><a href="#" onclick="navigate('dashboard')">Dashboard</a></li>
          <li class="breadcrumb-item active">Cache Status</li>
        </ol>
      </nav>
    </div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold mb-0"><i class="bi bi-database-fill me-2 text-moodle"></i>LRU Cache Status</h2>
      <button class="btn btn-outline-secondary btn-sm" onclick="navigate('cache')">
        <i class="bi bi-arrow-clockwise me-1"></i>Refresh
      </button>
    </div>
    <div class="row g-3">
      ${status.map(s => `
        <div class="col-md-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-bottom py-3">
              <h6 class="mb-0 fw-semibold"><i class="bi bi-hdd-stack me-2 text-moodle"></i>${escHtml(s.section)}</h6>
            </div>
            <div class="card-body p-0">
              ${s.entries.length === 0
                ? `<div class="text-center py-3 text-muted small"><i class="bi bi-inbox me-1"></i>Empty</div>`
                : `<ul class="list-group list-group-flush">
                    ${s.entries.map((e, i) => `
                      <li class="list-group-item d-flex justify-content-between align-items-center px-4 py-2">
                        <span class="badge bg-moodle-subtle text-moodle me-2">${i + 1}</span>
                        <code class="flex-grow-1">${escHtml(e.key)}</code>
                        <span class="text-muted small ms-2">${escHtml(e.val)}</span>
                      </li>
                    `).join('')}
                  </ul>`
              }
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="alert alert-info border-0 shadow-sm mt-4 d-flex align-items-center gap-2">
      <i class="bi bi-info-circle-fill fs-5"></i>
      <div>
        <strong>LRU Eviction Policy:</strong> Each cache bucket holds up to <strong>5 search results</strong> and up to <strong>10 input history entries</strong>. The least-recently-used entry is evicted when capacity is reached — mirroring the Java backend's <code>CacheAPI</code> implementation.
      </div>
    </div>`;
}

// ── Utilities ────────────────────────────────────────────────
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function courseTypeBadge(type) {
  switch ((type || '').toLowerCase()) {
    case 'core':       return 'bg-primary-subtle text-primary';
    case 'elective':   return 'bg-success-subtle text-success';
    case 'university': return 'bg-warning-subtle text-warning';
    default:           return 'bg-secondary-subtle text-secondary';
  }
}

// ── Seed Demo Data ───────────────────────────────────────────
function seedDemo() {
  StudentOps.add('Ahmad',   'Razali',    'S001', 'ahmad@uni.edu.my',   '0123456789');
  StudentOps.add('Siti',    'Norzahra',  'S002', 'siti@uni.edu.my',    '0198765432');
  StudentOps.add('Wei',     'Ming',      'S003', 'weiming@uni.edu.my', '0112233445');
  StudentOps.add('Priya',   'Krishnan',  'S004', 'priya@uni.edu.my',   '0134455667');
  CourseOps.add('Data Structures & Algorithms', 'CS301', 3, 'Covers arrays, linked lists, trees, graphs, and sorting algorithms.', 'https://teams.microsoft.com/l/channel/CS301', 'core');
  CourseOps.add('Software Engineering',         'CS401', 3, 'Software development lifecycle, design patterns, and agile practices.', 'https://teams.microsoft.com/l/channel/CS401', 'core');
  CourseOps.add('Mobile Application Dev',       'CS451', 3, 'Building cross-platform mobile applications using modern frameworks.', 'https://teams.microsoft.com/l/channel/CS451', 'elective');
  CourseOps.add('Malaysian Studies',            'MPU301', 2, 'History, culture, and civic responsibilities of Malaysia.', '', 'university');
  EnrollmentOps.enroll('CS301', 'S001');
  EnrollmentOps.enroll('CS301', 'S002');
  EnrollmentOps.enroll('CS401', 'S001');
  EnrollmentOps.enroll('CS451', 'S003');
  EnrollmentOps.enroll('MPU301', 'S004');
}

// ── Bootstrap ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  seedDemo();
  navigate('dashboard');

  // Sidebar toggle
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('d-none');
  });
});
