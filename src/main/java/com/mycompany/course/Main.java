package com.mycompany.course;

import java.util.Scanner;

public class Main {

    private static final int MAX_STUDENTS = 100;

    public static void main(String[] args) {
        new Main().run();
    }

    private void run() {

        CacheAPI  sharedCache        = new CacheAPI();
        Student[] sharedStudents     = new Student[MAX_STUDENTS];
        int[]     sharedStudentCount = {0};


        StudentManager studentManager = new StudentManager(
                sharedCache, sharedStudents, sharedStudentCount);

        CourseManager courseManager = new CourseManager(
                sharedCache, sharedStudents, sharedStudentCount);

        Scanner scanner = new Scanner(System.in);
        boolean running = true;

        while (running) {
            printMainMenu();
            System.out.print("Choose a module: ");
            String input = scanner.nextLine().trim();

            switch (input) {
                case "1": studentManager.run(); break;
                case "2": courseManager.run();  break;
                case "3": sharedCache.printCacheStatus(); break;
                case "4": running = false;
                    break;
                default:
                    System.out.println("Invalid choice. Enter 1, 2, 3, or 4.");
            }
        }
        scanner.close();
    }

    private void printMainMenu() {

        System.out.println(" Student Learning Management System ");
        System.out.println(" 1. Student Management ");
        System.out.println(" 2. Course & Relationship Management ");
        System.out.println(" 3. View Cache Status ");
        System.out.println(" 4. Exit ");

    }
}
