# Student Learning Management System (SLMS)

[![Deploy to GitHub Pages](https://github.com/osman-builds/SLMS/actions/workflows/deploy-frontend.yml/badge.svg)](https://github.com/osman-builds/SLMS/actions/workflows/deploy-frontend.yml)
![Java](https://img.shields.io/badge/Java-17%2B-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-Build-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Frontend-Bootstrap_5-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/Hosted-GitHub_Pages-222222?style=for-the-badge&logo=github&logoColor=white)

> A Student Learning Management System featuring a **Moodle-inspired web frontend** and a **console-based Java backend**. Built as an academic software engineering exercise to demonstrate object-oriented design, state sharing, custom data structures, and modern CI/CD deployment.

🌐 **Live Demo:** [https://osman-builds.github.io/SLMS/](https://osman-builds.github.io/SLMS/frontend/)

---

## 🌐 Web Frontend

A fully interactive **Moodle-style** single-page web application built with **Bootstrap 5** and **Vanilla JavaScript**. It mirrors all Java backend logic directly in the browser using in-memory data structures — no server or database required.

### What It Looks Like

The frontend replicates the familiar Moodle LMS design:
- A **fixed top navigation bar** with the SLMS branding, a search bar, notification icons, and a user avatar dropdown.
- A **collapsible dark sidebar** with sectioned navigation links (Navigation, Management, System).
- A **main content area** that dynamically renders pages without reloading.
- A **toast notification system** for real-time feedback on all actions.
- A **responsive layout** that adapts to mobile devices (sidebar collapses on small screens).

### Pages & Features

| Page | What it does |
| :--- | :--- |
| **Dashboard** | Displays live stats (total students, courses, enrollments, cache size), course cards, a recent students table, and quick-action buttons |
| **Student Management** | Full CRUD — add, view, search, edit, and delete student profiles; each student gets colour-coded avatar initials |
| **Course Management** | Full CRUD with course type badges (`Core` / `Elective` / `University`); search and filter courses by name |
| **Enrollment** | Enrol a student into a course, view full class rosters per course, and see all courses a specific student is enrolled in |
| **Cache Status** | Live visual representation of the LRU cache state, mirroring the Java `CacheAPI` bucket structure |

### Frontend File Structure

```text
frontend/
├── index.html          ← Single HTML entry point; loads navbar, sidebar, footer & scripts
├── css/
│   └── style.css       ← Custom Moodle-inspired theme (Bootstrap 5 overrides + CSS variables)
└── js/
    └── app.js          ← All application logic: routing, state, CRUD, UI rendering
```

**`index.html`** — The shell of the application. Contains:
- The fixed top navbar with the SLMS brand, search bar, and user dropdown.
- The dark sidebar with navigation links wired to the `navigate()` JS function.
- An empty `<main id="mainContent">` block — all page content is injected here by `app.js`.
- A toast container for system notifications.
- CDN links for Bootstrap 5 and Bootstrap Icons.

**`css/style.css`** — Custom styling using CSS custom properties:
- Defines the Moodle colour palette (`--moodle-orange: #f98012`, `--moodle-dark: #3a3a3a`).
- Overrides Bootstrap's default component styles for navbar, sidebar, cards, and tables.
- Adds micro-animations on cards and buttons (`transform`, `transition`).
- Includes responsive breakpoints for mobile sidebar toggling.

**`js/app.js`** — The entire application brain (~1 200 lines):
- **State** — In-memory arrays and objects replace a database (`students[]`, `courses[]`, enrollment matrix).
- **Router** — A `navigate(page)` function swaps content inside `#mainContent` without page reloads.
- **CRUD** — Each module (students, courses, enrollment, cache) has its own render, create, update, and delete functions.
- **LRU Cache** — A JavaScript replica of the Java `CacheAPI` with LRU eviction and history tracking.
- **Toast System** — Provides colour-coded `success`, `danger`, and `warning` notifications.

### Frontend Tech Stack

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| HTML5 | — | App shell & semantic structure |
| Vanilla JavaScript | ES6+ | All routing, state, and CRUD logic |
| Bootstrap 5 | 5.3.3 | Responsive layout & UI components (via CDN) |
| Bootstrap Icons | 1.11.3 | Icon set across all pages (via CDN) |
| Google Fonts — Inter | — | Clean, modern typography |
| CSS Custom Properties | — | Centralized Moodle-style theming |

---

## 🚀 Deploying the Frontend to GitHub Pages

The project uses **GitHub Actions** to automatically deploy the `frontend/` folder to GitHub Pages on every push to `main`.

### Step 1 — Enable GitHub Pages (One-Time Setup)

> ⚠️ This must be done **once** by a repository admin before any deployment can succeed.

1. Go to your repository on GitHub.
2. Click the **Settings** tab (top navigation).
3. Scroll down and click **Pages** in the left sidebar.
4. Under **"Build and deployment"**, set **Source** to **`GitHub Actions`**.
5. Click **Save**.

That's it — GitHub Pages is now ready to receive deployments.

### Step 2 — Deploy by Pushing to `main`

The workflow triggers automatically whenever you push changes to the `frontend/` folder or the workflow file itself.

```bash
# Navigate to the project repo
cd path/to/Group2-01CT-

# Stage the frontend files
git add frontend/
git add .github/workflows/deploy-frontend.yml

# Commit your changes
git commit -m "feat: update SLMS frontend"

# Push to main — this triggers the deployment workflow
git push origin main
```

### Step 3 — Monitor the Deployment

1. Go to your GitHub repo.
2. Click the **Actions** tab.
3. Find the workflow **"Deploy SLMS Frontend to GitHub Pages"** — it will be running (yellow spinner) or completed (green ✅).
4. Click on it to see the live logs for each step.

> The deployment usually takes **1–2 minutes** to complete.

### Step 4 — Visit the Live Site

Once the workflow shows ✅, your site is live at:

```
https://osman-builds.github.io/SLMS/
```

---

### Manual Trigger (Re-deploy Without Code Changes)

If you need to re-deploy without making any code changes:

1. Go to **Actions** tab on GitHub.
2. Click **"Deploy SLMS Frontend to GitHub Pages"** in the left sidebar.
3. Click the **"Run workflow"** button (top right of the table).
4. Select branch `main` → click **"Run workflow"**.

---

### How the Workflow Works

The deployment is defined in `.github/workflows/deploy-frontend.yml`:

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'                           # Only triggers when frontend files change
      - '.github/workflows/deploy-frontend.yml'
  workflow_dispatch:                            # Enables the manual trigger button

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4               # 1. Check out the repo
      - uses: actions/configure-pages@v5        # 2. Configure Pages settings
      - uses: actions/upload-pages-artifact@v3  # 3. Package the frontend/ folder
        with:
          path: './frontend'
      - uses: actions/deploy-pages@v4           # 4. Push the package to GitHub Pages
```

### Troubleshooting

| Problem | Solution |
| :--- | :--- |
| Workflow doesn't trigger after push | Make sure you pushed to the `main` branch (not `master` or a feature branch) |
| `Error: Pages not enabled` in the Actions log | Complete **Step 1** above — enable Pages in repo Settings |
| Workflow fails with a **permissions** error | Go to Settings → Actions → General → set **"Read and write permissions"** |
| Live site shows a 404 page | GitHub Pages may still be propagating — wait 2–3 minutes and refresh |
| Site shows an old version | Hard-refresh your browser (`Ctrl + Shift + R`) or clear browser cache |
| Badge shows `failing` | Check the Actions tab for the specific error message in the latest run |

---

## 🏗️ Software Design & Architecture

The architecture focuses on modularity, encapsulation, and clear separation of concerns without relying on external databases.

| Architecture Pattern | Implementation Details |
| :--- | :--- |
| **Centralized State Management** | The `Main` class initializes a shared `Student[]` array and an enrollment counter. These are passed to `CourseManager` and `StudentManager` via **Constructor Injection**, reducing tight coupling and maintaining a single source of truth. |
| **Adjacency Matrix** | The many-to-many relationship between students and courses is handled using a 2D boolean array (`courseStudentRelationships[][]`). This allows for $O(1)$ time complexity when verifying enrollments. |
| **LRU Cache & History** | A custom `CacheAPI` utilizes an `LruMap` (extending `LinkedHashMap` with overridden `removeEldestEntry` logic) to enforce a Least-Recently-Used eviction policy. This optimizes searches and tracks input history for console auto-suggestions. |

---

## 📁 Project Structure

```text
SLMS/
├── .github/
│   └── workflows/
│       └── deploy-frontend.yml   # CI/CD — auto-deploys frontend to GitHub Pages
│
├── frontend/                     # Moodle-style Web UI
│   ├── index.html                # App shell — navbar, sidebar, footer
│   ├── css/
│   │   └── style.css             # Bootstrap overrides & Moodle-style theme
│   └── js/
│       └── app.js                # Full SLMS logic (JS replica of Java backend)
│
└── src/main/java/com/mycompany/course/
    ├── CacheAPI.java             # LRU caching and history tracking mechanism
    ├── Course.java               # Course entity/model
    ├── CourseManager.java        # Business logic for courses and student enrollments
    ├── Main.java                 # Application entry point and dependencies injector
    ├── Student.java              # Student entity/model
    └── StudentManager.java       # Business logic for student profiles
```

---

## ⚙️ System Capabilities

- **Student Module** — Create, read, update, delete, and search student profiles.
- **Course Module** — Create, read, update, delete, and search course details.
- **Enrollment Management** — Register students for courses, print full class rosters, and display individual student schedules.

---

## ⚠️ Assumptions & Limitations

* **Fixed Capacity:** Strict memory predictability is enforced by using fixed-size arrays (maximum of 100 students and 100 courses).
* **Volatile Storage:** The application operates completely in-memory. State is lost upon termination. Integration with file-based I/O serialization or an RDBMS is reserved for future extensions.

---

## 🖥️ Compilation & Execution (Java Backend)

### Prerequisites
- **Java Development Kit (JDK)**: Version 17 or higher
- **Apache Maven**: Version 3.8+

### CLI Execution
Navigate to the root directory containing the `pom.xml` file and execute:

```bash
mvn clean compile
mvn exec:java -Dexec.mainClass="com.mycompany.course.Main"
```

### IDE Execution
1. Import the root directory as a **Maven project** into your preferred IDE (IntelliJ IDEA, Eclipse, VS Code).
2. Navigate to `src/main/java/com/mycompany/course/Main.java`.
3. Execute the `main` method.

### Frontend (No Setup Required)
Open `frontend/index.html` directly in any modern browser — or visit the live hosted version:
> 🌐 **[https://osman-builds.github.io/SLMS/](https://osman-builds.github.io/SLMS/)**

---

*Developed by Group 2 — 01CT — SCM Project*
