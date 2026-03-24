package com.mycompany.course;

import java.util.Scanner;

// Main application – handles course input (Task 2)
public class CourseManager {

    private static final int MAX_COURSES = 100;          // max capacity
    private final Course[] courses = new Course[MAX_COURSES]; // array to store courses (Task 2c)
    private int courseCount = 0;                          // tracks number of stored courses
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
                case 1:
                    submitCourseProfile();
                    break;
                case 2:
                    displayAllCourses();
                    break;
                case 3: editCourse(courseCode);
                    break;
                case 4: System.out.println("Edit a course: ");
                    break;
                case 5: deleteCourse();
                    break;

                case 6: running = false;
                    break;
                default: System.out.println("Invalid choice: Please select from 1 to 6");
            }
        }

        scanner.close();
    }

    // Display menu options
    private void printMenu() {
        System.out.println("\n===== Student Learning Management System =====");
        System.out.println("1. Add a course ");
        System.out.println("2. Display all course ");
        System.out.println("3. Search a course ");
        System.out.println("4. Edit a course ");
        System.out.println("5. Delete a course ");
        System.out.println("6. Exit");
    }

    // ===================== TASK 2: Course Input =====================

    // Task 2b: Submit button – collects input and adds course to array
    private void submitCourseProfile() {

        // Task 2d: Prevent array out-of-bound error
        if (courseCount >= MAX_COURSES) {
            System.out.println("Cannot add more courses. Storage is full (" + MAX_COURSES + ").");
            return;
        }

        // Task 2a: Input fields for each course attribute
        System.out.println("\n--- Submit Course Profile ---");
        String courseName = readNonEmptyString("Course name: ");
        String courseCode = readNonEmptyString("Course code: ");
        int creditHour = readInt("Credit hour: ");
        String courseSummary = readNonEmptyString("Course summary: ");
        String msTeamsLink = readNonEmptyString("MS Teams link: ");

        // Task 2c: Store course object in the array
        Course newCourse = new Course(courseName, courseCode, creditHour, courseSummary, msTeamsLink);
        courses[courseCount] = newCourse;
        courseCount++;

        System.out.println("Course submitted successfully. Total stored: " + courseCount + "/" + MAX_COURSES);
    }

    // ===================== Display Helpers =====================

    private void pause() {
        System.out.println("\nPress Enter to return to the menu...");
        scanner.nextLine();
    }

    // List all stored courses
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

        int index = -1;

        for (int i = 0; i < courseCount; i++) {
            if (courses[i].getCourseCode().equalsIgnoreCase(code)) {
                index = i;
                break;
            }
        }

        if (index == -1) {
            System.out.println("Course not found.");
            return;
        }

        System.out.println("course Found:");
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

        displayAllCourses();
    }

    // Print all attributes of a single course
    private void displayCourse(Course course) {
        System.out.println("Course Name    : " + course.getCourseName());
        System.out.println("Course Code    : " + course.getCourseCode());
        System.out.println("Credit Hour    : " + course.getCreditHour());
        System.out.println("Course Summary : " + course.getCourseSummary());
        System.out.println("MS Teams Link  : " + course.getMsTeamsLink());
    }

    // ===================== Input Helpers =====================

    // Read a non-empty string from user
    private String readNonEmptyString(String prompt) {
        while (true) {
            System.out.print(prompt);
            String value = scanner.nextLine().trim();
            if (!value.isEmpty()) {
                return value;
            }
            System.out.println("Input cannot be empty. Please try again.");
        }
    }

    static  void editCourse(String courseCode ){
        System.out.println("s");


    }
    // Read a non-negative integer from user
    private int readInt(String prompt) {
        while (true) {
            System.out.print(prompt);
            String input = scanner.nextLine().trim();
            try {
                int value = Integer.parseInt(input);
                if (value < 0) {
                    System.out.println("Value cannot be negative. Please try again.");
                    continue;
                }
                return value;
            } catch (NumberFormatException ex) {
                System.out.println("Invalid number. Please enter an integer value.");
            }

        }

    }
}

