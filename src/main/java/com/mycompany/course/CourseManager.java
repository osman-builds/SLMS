package com.mycompany.course;

import java.util.Scanner;


public class CourseManager {

    private static final int MAX_COURSES  = 100;
    private static final int MAX_STUDENTS = 100;

    private final Course[]    courses = new Course[MAX_COURSES];
    private int courseCount = 0;

    // Shared with StudentManager via Main
    private final Student[] students;
    private final int[]     studentCount;

    private final boolean[][] courseStudentRelationships =
            new boolean[MAX_COURSES][MAX_STUDENTS];

    private final Scanner  scanner;
    private final CacheAPI cache;

    // Constructors


    public CourseManager(CacheAPI sharedCache, Student[] sharedStudents, int[] sharedStudentCount) {
        this.cache        = sharedCache;
        this.students     = sharedStudents;
        this.studentCount = sharedStudentCount;
        this.scanner      = new Scanner(System.in);
    }


    public CourseManager() {
        this(new CacheAPI(), new Student[MAX_STUDENTS], new int[]{0});
    }

    // Entry point

    public static void main(String[] args) {
        new CourseManager().run();
    }

    public void run() {
        boolean running = true;
        while (running) {
            printMenu();
            int choice = readInt("Choose an option: ");
            switch (choice) {
                case 1:  submitCourseProfile();    break;
                case 2:  displayAllCourses();      break;
                case 3:  searchCourse();           break;
                case 4:  editCourse();             break;
                case 5:  deleteCourse();           break;
                case 6:  enrollStudent();          break;
                case 7:  listCourses();            break;
                case 8:  findStudentInCourse();    break;
                case 9:  listStudentsInCourse();   break;
                case 10: running = false;          break;
                default: System.out.println("Invalid choice. Select 1–10.");
            }
        }
    }

    private void printMenu() {
        System.out.println("\n Course & Relationship Management ");
        System.out.println(" 1. Add a course"); //a
        System.out.println(" 2. Display all courses");
        System.out.println(" 3. Search a course");
        System.out.println(" 4. Edit a course");
        System.out.println(" 5. Delete a course");
        System.out.println(" 6. enrol student into a course"); //b
        System.out.println(" 7. List a student's courses"); //d
        System.out.println(" 8. Find student in a course"); //c
        System.out.println(" 9. List all students in a course"); //f
        System.out.println("10. Back to main menu");
    }



    private void submitCourseProfile() {
        if (courseCount >= MAX_COURSES) {
            System.out.println("Storage full (" + MAX_COURSES + " courses).");
            return;
        }
        System.out.println("\n--- Add Course ---");

        String name = readWithSuggestions("Course name: ", CacheAPI.FIELD_COURSE_NAME);
        String code = readWithSuggestions("Course code: ", CacheAPI.FIELD_COURSE_CODE);

        if (findCourseIndex(code) != -1) {
            System.out.println("Error: Course code '" + code + "' already exists.");
            return;
        }

        int    credit  = readInt("Credit hours: ");
        String summary = readNonEmptyString("Course summary: ");
        String teams   = readNonEmptyString("MS Teams link: ");

        courses[courseCount++] = new Course(name, code, credit, summary, teams);
        cache.cacheSearchResult(CacheAPI.TYPE_COURSE, code, code + " – " + name);
        System.out.println("Course added. Total: " + courseCount + "/" + MAX_COURSES);
    }

    void displayAllCourses() {
        System.out.println("\n--- All Courses ---");
        if (courseCount == 0) { System.out.println("No courses stored."); return; }
        for (int i = 0; i < courseCount; i++) {
            System.out.println("\nCourse #" + (i + 1));
            displayCourse(courses[i]);
        }
    }

    private void searchCourse() {
        System.out.println("\n--- Search Course ---");
        String code = readWithSuggestions("Enter course code: ", CacheAPI.FIELD_COURSE_CODE);

        String cached = cache.getCachedResult(CacheAPI.TYPE_COURSE, code);
        if (cached != null) System.out.println("[Cache hit] " + cached);

        int idx = findCourseIndex(code);
        if (idx == -1) { System.out.println("Course not found."); return; }

        displayCourse(courses[idx]);
        cache.cacheSearchResult(CacheAPI.TYPE_COURSE, code,
                code + " – " + courses[idx].getCourseName());
    }

    private void editCourse() {
        System.out.println("\n--- Edit Course ---");
        String code = readWithSuggestions("Enter course code to edit: ", CacheAPI.FIELD_COURSE_CODE);
        int idx = findCourseIndex(code);
        if (idx == -1) { System.out.println("Course not found."); return; }

        Course c = courses[idx];
        System.out.println("\nCurrent details:");
        displayCourse(c);
        System.out.println("\n[Leave blank to keep current value]");

        String newName = readOptionalString("New course name (" + c.getCourseName() + "): ");
        if (!newName.isEmpty()) {
            c.setCourseName(newName);
            cache.recordInput(CacheAPI.FIELD_COURSE_NAME, newName);
        }

        String newType = readOptionalString("New course type (" + c.getCourseType() + "): ");
        if (!newType.isEmpty()) c.setCourseType(newType);

        String creditStr = readOptionalString("New credit hours (" + c.getCreditHour() + "): ");
        if (!creditStr.isEmpty()) {
            try { c.setCreditHour(Integer.parseInt(creditStr)); }
            catch (NumberFormatException e) { System.out.println("Invalid number; unchanged."); }
        }

        String newSummary = readOptionalString("New summary (" + c.getCourseSummary() + "): ");
        if (!newSummary.isEmpty()) c.setCourseSummary(newSummary);

        String newTeams = readOptionalString("New MS Teams link (" + c.getMsTeamsLink() + "): ");
        if (!newTeams.isEmpty()) c.setMsTeamsLink(newTeams);

        cache.cacheSearchResult(CacheAPI.TYPE_COURSE, code,
                code + " – " + c.getCourseName());
        System.out.println("Course updated.");
    }

    void deleteCourse() {
        if (courseCount == 0) { System.out.println("No courses to delete."); return; }

        String code = readWithSuggestions("Enter course code to delete: ", CacheAPI.FIELD_COURSE_CODE);
        int idx = findCourseIndex(code);
        if (idx == -1) { System.out.println("Course not found."); return; }

        displayCourse(courses[idx]);
        String confirm = readNonEmptyString("This cannot be undone. Delete? (Yes/No): ");
        if (!confirm.equalsIgnoreCase("Yes")) { System.out.println("Cancelled."); return; }

        for (int i = idx; i < courseCount - 1; i++) courses[i] = courses[i + 1];
        courses[--courseCount] = null;

        cache.evict(CacheAPI.TYPE_COURSE, code);
        System.out.println("Course deleted.");
    }

    // Relationship management

    private void enrollStudent() {
        System.out.println("\n--- Enrol Student in Course ---");
        String code = readWithSuggestions("Course code: ", CacheAPI.FIELD_COURSE_CODE);
        String sid  = readWithSuggestions("Student ID:  ", CacheAPI.FIELD_STUDENT_ID);
        linkStudentToCourse(code, sid);
    }

    public void linkStudentToCourse(String courseCode, String studentId) {
        int cIdx = findCourseIndex(courseCode);
        int sIdx = findStudentIndex(studentId);

        if (cIdx == -1) {
            System.out.println("Error: Course '" + courseCode + "' not found.");
            return;
        }
        if (sIdx == -1) {
            // Student exists in StudentManager's shared array but ID wasn't recognised —
            // this path now only triggers if the ID genuinely doesn't exist anywhere.
            String name = readNonEmptyString("Student not found. Enter name to create record: ");
            addStudentToSharedArray(studentId, name);
            sIdx = findStudentIndex(studentId);
        }
        if (courseStudentRelationships[cIdx][sIdx]) {
            System.out.println("Error: " + studentId + " is already enrolled in " + courseCode + ".");
            return;
        }

        courseStudentRelationships[cIdx][sIdx] = true;
        cache.cacheSearchResult(CacheAPI.TYPE_COURSE,  courseCode,
                courseCode + " – " + courses[cIdx].getCourseName());
        cache.cacheSearchResult(CacheAPI.TYPE_STUDENT, studentId,
                studentId  + " – " + students[sIdx].getStudentName());

        System.out.println("Enrolled " + students[sIdx].getStudentName()
                + " (" + studentId + ") in " + courses[cIdx].getCourseName()
                + " (" + courseCode + ").");
    }

    public void listCourses() {
        System.out.println("\n--- List Student's Courses ---");
        String sid = readWithSuggestions("Student ID: ", CacheAPI.FIELD_STUDENT_ID);
        int sIdx = findStudentIndex(sid);
        if (sIdx == -1) { System.out.println("Error: Student ID not found."); return; }

        System.out.println("\nCourses for " + students[sIdx].getStudentName() + ":");
        boolean found = false;
        for (int c = 0; c < courseCount; c++) {
            if (courseStudentRelationships[c][sIdx]) {
                System.out.println("  • " + courses[c].getCourseCode()
                        + " – " + courses[c].getCourseName());
                found = true;
            }
        }
        if (!found) System.out.println("  This student is not enrolled in any courses.");
    }

    public void findStudentInCourse() {
        System.out.println("\n--- Find Student in Course ---");
        String code = readWithSuggestions("Course code: ", CacheAPI.FIELD_COURSE_CODE);
        String sid  = readWithSuggestions("Student ID:  ", CacheAPI.FIELD_STUDENT_ID);

        int cIdx = findCourseIndex(code);
        int sIdx = findStudentIndex(sid);

        if (cIdx == -1) { System.out.println("Error: Course not found."); return; }
        if (sIdx == -1) { System.out.println("Error: Student not found."); return; }

        if (courseStudentRelationships[cIdx][sIdx]) {
            System.out.println("Match found: " + students[sIdx].getStudentName()
                    + " is enrolled in " + courses[cIdx].getCourseName() + ".");
            cache.cacheSearchResult(CacheAPI.TYPE_COURSE,  code,
                    code + " – " + courses[cIdx].getCourseName());
            cache.cacheSearchResult(CacheAPI.TYPE_STUDENT, sid,
                    sid  + " – " + students[sIdx].getStudentName());
        } else {
            System.out.println("No enrolment found for " + sid + " in " + code + ".");
        }
    }

    public void listStudentsInCourse() {
        System.out.println("\n--- List Students in Course ---");
        String code = readWithSuggestions("Course code: ", CacheAPI.FIELD_COURSE_CODE);
        int cIdx = findCourseIndex(code);
        if (cIdx == -1) { System.out.println("Error: Course not found."); return; }

        System.out.println("\nStudents in " + courses[cIdx].getCourseName() + ":");
        boolean found = false;
        for (int s = 0; s < studentCount[0]; s++) {
            if (courseStudentRelationships[cIdx][s]) {
                System.out.println("  • " + students[s].getStudentId()
                        + " – " + students[s].getStudentName());
                found = true;
            }
        }
        if (!found) System.out.println("  No students enrolled yet.");
    }



    //fallback when id not found
    private void addStudentToSharedArray(String studentId, String studentName) {
        if (studentCount[0] >= MAX_STUDENTS) {
            System.out.println("Cannot add student: storage full.");
            return;
        }
        students[studentCount[0]++] = new Student(studentId, studentName);
        cache.cacheSearchResult(CacheAPI.TYPE_STUDENT, studentId,
                studentId + " – " + studentName);
        cache.recordInput(CacheAPI.FIELD_STUDENT_ID,   studentId);
        cache.recordInput(CacheAPI.FIELD_STUDENT_NAME, studentName);
    }

    private void displayCourse(Course c) {
        System.out.println(" Course name : " + c.getCourseName());
        System.out.println(" Course code : " + c.getCourseCode());
        System.out.println(" Course type : " + c.getCourseType());
        System.out.println(" Credit hours : " + c.getCreditHour());
        System.out.println(" Summary : " + c.getCourseSummary());
        System.out.println(" MS Teams link : " + c.getMsTeamsLink());
    }

    private int findCourseIndex(String code) {
        for (int i = 0; i < courseCount; i++)
            if (courses[i].getCourseCode().equalsIgnoreCase(code)) return i;
        return -1;
    }


    private int findStudentIndex(String id) {
        for (int i = 0; i < studentCount[0]; i++)
            if (students[i].getStudentId().equalsIgnoreCase(id)) return i;
        return -1;
    }

    private String readWithSuggestions(String prompt, String field) {
        cache.printSuggestions(field, "");
        String value = readNonEmptyString(prompt);
        cache.recordInput(field, value);
        return value;
    }

    private String readNonEmptyString(String prompt) {
        while (true) {
            System.out.print(prompt);
            String v = scanner.nextLine().trim();
            if (!v.isEmpty()) return v;
            System.out.println("Input cannot be empty.");
        }
    }

    private String readOptionalString(String prompt) {
        System.out.print(prompt);
        return scanner.nextLine().trim();
    }

    private int readInt(String prompt) {
        while (true) {
            System.out.print(prompt);
            try {
                int v = Integer.parseInt(scanner.nextLine().trim());
                if (v >= 0) return v;
                System.out.println("Value cannot be negative.");
            } catch (NumberFormatException e) {
                System.out.println("Invalid number.");
            }
        }
    }
}
