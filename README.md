# Student Learning Management System (SLMS)

![Java](https://img.shields.io/badge/Java-17%2B-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-Build-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white)
![Design](https://img.shields.io/badge/Pattern-Constructor_Injection-blue?style=for-the-badge)

> A console-based Java application designed for university course and student enrollment management. Developed as an academic software engineering exercise to demonstrate object-oriented design, state sharing, and custom data structures operating entirely in-memory.

---

## Software Design & Architecture

The architecture focuses on modularity, encapsulation, and clear separation of concerns without relying on external databases.

| Architecture Pattern | Implementation Details |
| :--- | :--- |
| **Centralized State Management** | The `Main` class initializes a shared `Student[]` array and an enrollment counter. These are passed to `CourseManager` and `StudentManager` via **Constructor Injection**, reducing tight coupling and maintaining a single source of truth. |
| **Adjacency Matrix** | The many-to-many relationship between students and courses is handled using a 2D boolean array (`courseStudentRelationships[][]`). This allows for $O(1)$ time complexity when verifying enrollments. |
| **LRU Cache & History** | A custom `CacheAPI` utilizes an `LruMap` (extending `LinkedHashMap` with overridden `removeEldestEntry` logic) to enforce a Least-Recently-Used eviction policy. This optimizes searches and tracks input history for console auto-suggestions. |

---

## Project Structure

The codebase is organized into focused domain entities and manager classes:

```text
src/main/java/com/mycompany/course/
├── CacheAPI.java         # LRU caching and history tracking mechanism
├── Course.java           # Course entity/model 
├── CourseManager.java    # Business logic for courses and student enrollments
├── Main.java             # Application entry point and dependencies injector
├── Student.java          # Student entity/model
└── StudentManager.java   # Business logic for student profiles
```

---

## System Capabilities

- **Student Module**  
  Create, read, update, delete, and search student profiles.
  
- **Course Module**  
  Create, read, update, delete, and search course details.
  
- **Enrollment Management**  
  Register students for courses, print full class rosters, and display individual student schedules.

---

## Assumptions & Limitations

* **Fixed Capacity:** Strict memory predictability is enforced by using fixed-size arrays (maximum of 100 students and 100 courses).
* **Volatile Storage:** The application operates completely in-memory. State is lost upon termination. Integration with file-based I/O serialization or an RDBMS is reserved for future extensions.

---

## Compilation & Execution

### Prerequisites
- **Java Development Kit (JDK)**: Version 17 or higher
- **Apache Maven**: Version 3.8+

### CLI Execution
Navigate to the root directory containing the `pom.xml` file and execute the following commands:

```bash
mvn clean compile
mvn exec:java -Dexec.mainClass="com.mycompany.course.Main"
```

### IDE Execution
1. Import the root directory as a **Maven project** into your preferred IDE (IntelliJ IDEA, Eclipse, VS Code).
2. Navigate to `src/main/java/com/mycompany/course/Main.java`.
3. Execute the `main` method.

---
*Developed by Group 2 - SCM Project*