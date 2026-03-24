package com.mycompany.course;

import java.util.Scanner;

public class StudentManager {

    // max number of students we can store, set to 100 to avoid array out of bound
    private static final int MAX_STUDENTS = 100;

    // array to store student objects
    private final Student[] students = new Student[MAX_STUDENTS];

    // keeps track of how many students are currently stored
    private int studentCount = 0;

    // scanner to read user input from console
    private final Scanner scanner = new Scanner(System.in);

    // main method, this is where the program starts
    public static void main(String[] args) {
        StudentManager app = new StudentManager();
        app.run();
    }

    // keeps the program running until user chooses to exit
    public void run() {
        boolean running = true;
        while (running) {
            printMenu();
            int choice = readInt("Choose an option: ");

            switch (choice) {
                case 1: submitStudentProfile(); break;
                case 2: displayAllStudents(); break;
                case 3: searchStudentModule(); break; // Integrated Task 3
                case 4: editStudentModule(); break;   // Integrated Task 4
                case 5: deleteStudent(); break;
                case 6: running = false; break;
                default: System.out.println("Invalid choice: Please select from 1 to 6");
            }
        }
    }

    // prints the menu options on the screen
    private void printMenu() {
        System.out.println("\n===== Student Learning Management System =====");
        System.out.println("1. Add a student");
        System.out.println("2. Display all students");
        System.out.println("3. Search a student");
        System.out.println("4. Edit a student");
        System.out.println("5. Delete a student");
        System.out.println("6. Exit");
    }

    // ======== Task 2: Create Function ====
    private void submitStudentProfile() {
        if (studentCount >= MAX_STUDENTS) {
            System.out.println("Storage is full.");
            return;
        }

        System.out.println("\n--- Submit Student Profile ---");
        String firstName   = readNonEmptyString("First name: ");
        String lastName    = readNonEmptyString("Last name: ");
        String studentId   = readNonEmptyString("Student ID: ");
        String email       = readNonEmptyString("Email: ");
        String phoneNumber = readNonEmptyString("Phone number: ");

        students[studentCount++] = new Student(firstName, lastName, studentId, email, phoneNumber);
        System.out.println("Student profile submitted successfully.");
    }

    // ======== Task 3: Search Function ====
    private void searchStudentModule() {
        String searchId = readNonEmptyString("Enter Student ID to search: ");
        int foundIndex = findStudentIndex(searchId);

        if (foundIndex != -1) {
            System.out.println("\n--- Student Found ---");
            displayStudent(students[foundIndex]);
        } else {
            // Requirement 3d: Provide clear feedback if the search fails
            System.out.println("Result: Student not found.");
        }
    }

    // ======== Task 4: Edit Function ====
    private void editStudentModule() {
        String editId = readNonEmptyString("Enter Student ID to edit: ");
        
        //find the index first to ensure the student exists before asking for new data
        int foundIndex = findStudentIndex(editId);

        if (foundIndex != -1) {
            Student target = students[foundIndex];
            System.out.println("\n--- Current Profile ---");
            displayStudent(target);

            System.out.println("\n[Editing Mode - Student ID cannot be changed]");
            target.setFirstName(readNonEmptyString("New First Name: "));
            target.setLastName(readNonEmptyString("New Last Name: "));
            target.setEmail(readNonEmptyString("New Email: "));
            target.setPhoneNumber(readNonEmptyString("New Phone Number: "));

            System.out.println("\nUpdate Successful! Validating changes:");
            displayStudent(target);
        } else {
            System.out.println("Error: Student not found. Edit aborted.");
        }
    }

    // ======== Task 5 & 6: Delete & Display Functions ====
    private void displayAllStudents() {
        if (studentCount == 0) {
            System.out.println("\nNo students to display.");
            return;
        }
        for (int i = 0; i < studentCount; i++) {
            System.out.println("--- Student " + (i + 1) + " ---");
            displayStudent(students[i]);
            System.out.println();
        }
    }

    private void deleteStudent() {
        if (studentCount == 0) {
            System.out.println("No students to delete.");
            return;
        }

        String targetId = readNonEmptyString("Enter Student ID to delete: ");
        int foundIndex = findStudentIndex(targetId);

        if (foundIndex == -1) {
            System.out.println("Student not found.");
        } else {
            System.out.println("\n--- Student Found ---");
            displayStudent(students[foundIndex]);

            String confirm = readNonEmptyString("Confirm deletion? (Yes/No): ");
            if (confirm.equalsIgnoreCase("Yes")) {
                for (int i = foundIndex; i < studentCount - 1; i++) {
                    students[i] = students[i + 1];
                }
                students[--studentCount] = null;
                System.out.println("Student deleted successfully.");
            } else {
                System.out.println("Deletion cancelled.");
            }
        }
    }

    // ======== Helper Logic Methods (Modularization) ====

    /**
     * Reusable Linear Search method to find index by ID.
     */
    private int findStudentIndex(String studentId) {
        for (int i = 0; i < studentCount; i++) {
            if (students[i].getStudentId().equalsIgnoreCase(studentId)) {
                return i;
            }
        }
        return -1;
    }

    private void displayStudent(Student student) {
        System.out.println("Name         : " + student.getFirstName() + " " + student.getLastName());
        System.out.println("Student ID   : " + student.getStudentId());
        System.out.println("Email        : " + student.getEmail());
        System.out.println("Phone Number : " + student.getPhoneNumber());
    }

    // =========== Input Helpers =============
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
            } catch (NumberFormatException e) {
                System.out.println("Invalid number.");
            }
        }
    }
}