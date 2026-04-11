package com.mycompany.course;

import java.util.Scanner;

// Main application – handles course input (Task 2)
public class CourseManager {

    private static final int MAX_COURSES = 100;          // max capacity
    private static final int MAX_STUDENTS = 100;
    private final Course[] courses = new Course[MAX_COURSES]; // array to store courses (Task 2c)
    private final Student[] students = new Student[MAX_STUDENTS];
    private final boolean[][] courseStudentRelationships = new boolean[MAX_COURSES][MAX_STUDENTS];
    private int courseCount = 0;                          // tracks number of stored courses
    private int studentCount = 0;
    private final Scanner scanner = new Scanner(System.in);
    String courseCode = " ";

    public static void main(String[] args) {
        CourseManager app = new CourseManager();
        app.run();
    }

    public void run() {
        boolean running = true;

        while (running) {
            printMenu();
            int choice = readInt("Choose an option: ");

            switch (choice) {
                case 1: submitCourseProfile(); break;
                case 2: displayAllCourses(); break;
                case 3: editCourse(courseCode); break;
                case 4: System.out.println("Edit a course: "); break;
                case 5: deleteCourse(); break;
                case 6: // Enroll Student in Course
                    String cCode = readNonEmptyString("Enter Course Code: ");
                    String sId = readNonEmptyString("Enter Student ID: ");
                    linkStudentToCourse(cCode, sId);
                    break;
                case 7: listCourses(); break;           // Task 2d
                case 8: findStudentInCourse(); break;   // Task 2e
                case 9: listStudentsInCourse(); break;  // Task 2f
                case 10: running = false; break;
                default: System.out.println("Invalid choice: Please select from 1 to 10");
            }
        }
        scanner.close();
    }

    // Display menu options
    private void printMenu() {
        System.out.println("\n===== Student Learning Management System =====");
        System.out.println("1. Add a Course");
        System.out.println("2. Display All Courses");
        System.out.println("3. Search a Course");
        System.out.println("4. Edit a Course");
        System.out.println("5. Delete a Course");
        System.out.println("6. Enroll Student in Course (Link)");
        System.out.println("7. List a Student's Courses");
        System.out.println("8. Find Student in a Course");
        System.out.println("9. List all Students in a Course");
        System.out.println("10. Exit");
    }

    // ===================== TASK 2: Course Input =====================

    private void submitCourseProfile() {
        if (courseCount >= MAX_COURSES) {
            System.out.println("Cannot add more courses. Storage is full (" + MAX_COURSES + ").");
            return;
        }

        System.out.println("\n--- Submit Course Profile ---");
        String courseName = readNonEmptyString("Course name: ");
        String courseCodeInput = readNonEmptyString("Course code: ");
        int creditHour = readInt("Credit hour: ");
        String courseSummary = readNonEmptyString("Course summary: ");
        String msTeamsLink = readNonEmptyString("MS Teams link: ");

        Course newCourse = new Course(courseName, courseCodeInput, creditHour, courseSummary, msTeamsLink);
        courses[courseCount] = newCourse;
        courseCount++;

        System.out.println("Course submitted successfully. Total stored: " + courseCount + "/" + MAX_COURSES);
    }

    void displayAllCourses() {
        System.out.println("\n--- All Courses ---");
        if (courseCount == 0) {
            System.out.println("No courses to display.");
            return;
        }
        for (int i = 0; i < courseCount; i++) {
            System.out.println("\nCourse #" + (i + 1));
            displayCourse(courses[i]);
        }
    }

    void deleteCourse() {
        if (courseCount == 0) {
            System.out.println("No courses to delete.");
            return;
        }
        String code = readNonEmptyString("Enter course code to delete: ");
        int index = findCourseIndex(code);

        if (index == -1) {
            System.out.println("Course not found.");
            return;
        }

        displayCourse(courses[index]);
        String confirm = readNonEmptyString("This action cannot be reversed. Continue deletion? (Yes/No): ");

        if (!confirm.equalsIgnoreCase("Yes")) {
            System.out.println("Action cancelled.");
            return;
        }

        for (int i = index; i < courseCount - 1; i++) {
            courses[i] = courses[i + 1];
        }
        courses[courseCount - 1] = null;
        courseCount--;
        System.out.println("Course deleted successfully.");
    }

    private void displayCourse(Course course) {
        System.out.println("Course Name    : " + course.getCourseName());
        System.out.println("Course Code    : " + course.getCourseCode());
        System.out.println("Course Type    : " + course.getCourseType());
        System.out.println("Credit Hour    : " + course.getCreditHour());
        System.out.println("Course Summary : " + course.getCourseSummary());
        System.out.println("MS Teams Link  : " + course.getMsTeamsLink());
    }

    // ===================== RELATIONSHIP MODULES =====================

    void linkStudentToCourse(String courseCode, String studentId) {
        int courseIndex = findCourseIndex(courseCode);
        int studentIndex = findStudentIndex(studentId);

        if (courseIndex == -1) {
            System.out.println("Error: Course not found.");
            return;
        }
        if (studentIndex == -1) {
            // If student doesn't exist, we add a basic profile for the relationship
            String name = readNonEmptyString("Student not found. Enter name to create new record: ");
            addStudentForRelationship(studentId, name);
            studentIndex = findStudentIndex(studentId);
        }
        
        if (courseStudentRelationships[courseIndex][studentIndex]) {
            System.out.println("Relationship already exists.");
            return;
        }

        courseStudentRelationships[courseIndex][studentIndex] = true;
        System.out.println("Successfully enrolled " + studentId + " in " + courseCode);
    }

    public void listCourses() {
        String studentId = readNonEmptyString("Enter Student ID: ");
        int sIndex = findStudentIndex(studentId);

        if (sIndex == -1) {
            System.out.println("Error: Student ID not found.");
            return;
        }

        System.out.println("\n--- Courses for Student: " + students[sIndex].getStudentName() + " ---");
        boolean hasCourses = false;
        // Check if enrollment exists in the 2D relationship matrix
        for (int cIndex = 0; cIndex < courseCount; cIndex++) {
            if (courseStudentRelationships[cIndex][sIndex]) {
                System.out.println("- " + courses[cIndex].getCourseCode() + ": " + courses[cIndex].getCourseName());
                hasCourses = true;
            }
        }
        if (!hasCourses) System.out.println("This student is not enrolled in any courses."); // error handling
    }

    public void findStudentInCourse() {
        String courseCodeInput = readNonEmptyString("Enter Course Code: ");
        String studentId = readNonEmptyString("Enter Student ID: ");

        //locate index for both entities in their own arrays
        int cIndex = findCourseIndex(courseCodeInput);
        int sIndex = findStudentIndex(studentId);
        
        //to confirm active relationship in the matrix
        if (cIndex != -1 && sIndex != -1 && courseStudentRelationships[cIndex][sIndex]) {
            System.out.println("Match Found: " + students[sIndex].getStudentName() + " is enrolled in " + courses[cIndex].getCourseName());
        } else {
            System.out.println("No matching enrollment found."); // error handling
        }
    }

    public void listStudentsInCourse() {
        String courseCodeInput = readNonEmptyString("Enter Course Code: ");
        int cIndex = findCourseIndex(courseCodeInput);
        
        //Ensure course exists before scanning relationships
        if (cIndex == -1) {
            System.out.println("Error: Course Code not found.");
            return;
        }

        System.out.println("\n--- Students Enrolled in " + courses[cIndex].getCourseName() + " ---");
        
        // Check if any students were found
        boolean hasStudents = false;
        for (int sIndex = 0; sIndex < studentCount; sIndex++) {
            if (courseStudentRelationships[cIndex][sIndex]) {
                System.out.println("- " + students[sIndex].getStudentId() + ": " + students[sIndex].getStudentName());
                hasStudents = true;
            }
        }
        if (!hasStudents) System.out.println("No students enrolled in this course yet."); // error handling
    }

    // ===================== HELPERS =====================

    void addStudentForRelationship(String studentId, String studentName) {
        if (studentCount >= MAX_STUDENTS) {
            System.out.println("Cannot add student: storage is full.");
            return;
        }
        students[studentCount] = new Student(studentId, studentName);
        studentCount++;
    }

    private int findCourseIndex(String code) {
        for (int i = 0; i < courseCount; i++) {
            if (courses[i].getCourseCode().equalsIgnoreCase(code)) return i;
        }
        return -1;
    }

    private int findStudentIndex(String id) {
        for (int i = 0; i < studentCount; i++) {
            if (students[i].getStudentId().equalsIgnoreCase(id)) return i;
        }
        return -1;
    }

    private String readNonEmptyString(String prompt) {
        while (true) {
            System.out.print(prompt);
            String value = scanner.nextLine().trim();
            if (!value.isEmpty()) return value;
            System.out.println("Input cannot be empty.");
        }
    }

    private int readInt(String prompt) {
        while (true) {
            System.out.print(prompt);
            try {
                int value = Integer.parseInt(scanner.nextLine().trim());
                if (value >= 0) return value;
                System.out.println("Value cannot be negative.");
            } catch (NumberFormatException ex) {
                System.out.println("Invalid number.");
            }
        }
    }

    static void editCourse(String courseCode) { System.out.println("Edit functionality placeholder"); }
}
