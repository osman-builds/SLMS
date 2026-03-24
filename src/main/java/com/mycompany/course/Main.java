package com.mycompany.course;

import java.util.Scanner;

public class Main {

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int choice;

        do {
            System.out.println("MAIN MENU");
            System.out.println("1. Student Manager");
            System.out.println("2. Course Manager");
            System.out.println("3. Exit");
            System.out.print("Enter your choice: ");

            choice = scanner.nextInt();

            switch (choice) {
                case 1:
                    System.out.println("Student Manager");
                    new StudentManager().run();
                    break;

                case 2:
                    System.out.println("Course Manager");
                    new CourseManager().run();
                    break;

                case 3:

                    break;

                default:
                    System.out.println("Please select from 1 to 3");
            }

        } while (choice != 3);

        scanner.close();
    }
}