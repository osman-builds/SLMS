package com.mycompany.course;

import java.util.Scanner;


public class StudentManager {

    private static final int MAX_STUDENTS = 100;


    private final Student[] students;
    private final int[]     studentCount;

    private final Scanner  scanner;
    private final CacheAPI cache;

    // ── Constructors ───────────────────────────────────────────────


    public StudentManager(CacheAPI sharedCache, Student[] sharedStudents, int[] sharedStudentCount) {
        this.cache        = sharedCache;
        this.students     = sharedStudents;
        this.studentCount = sharedStudentCount;
        this.scanner      = new Scanner(System.in);
    }


    public StudentManager() {
        this(new CacheAPI(), new Student[MAX_STUDENTS], new int[]{0});
    }



    public static void main(String[] args) {
        new StudentManager().run();
    }

    public void run() {
        boolean running = true;
        while (running) {
            printMenu();
            int choice = readInt("Choose an option: ");
            switch (choice) {
                case 1: submitStudentProfile();   break;
                case 2: displayAllStudents();     break;
                case 3: searchStudent();          break;
                case 4: editStudent();            break;
                case 5: deleteStudent();          break;
                case 6: running = false;          break;
                default: System.out.println("Invalid choice. Select 1–6.");
            }
        }
    }

    private void printMenu() {
        System.out.println("\n===== Student Management =====");
        System.out.println("1. Add a student");
        System.out.println("2. Display all students");
        System.out.println("3. Search a student");
        System.out.println("4. Edit a student");
        System.out.println("5. Delete a student");
        System.out.println("6. Back to main menu");
    }

    // ── CRUD ───────────────────────────────────────────────────────

    private void submitStudentProfile() {
        if (studentCount[0] >= MAX_STUDENTS) {
            System.out.println("Storage full.");
            return;
        }
        System.out.println("\n--- Add Student ---");

        String firstName = readNonEmptyString("First name: ");
        String lastName  = readNonEmptyString("Last name: ");

        cache.printSuggestions(CacheAPI.FIELD_STUDENT_ID, "");
        String studentId = readNonEmptyString("Student ID: ");

        if (findStudentIndex(studentId) != -1) {
            System.out.println("Error: Student ID '" + studentId + "' already exists.");
            return;
        }

        String email = readNonEmptyString("Email: ");
        String phone = readNonEmptyString("Phone number: ");

        Student s = new Student(firstName, lastName, studentId, email, phone);
        students[studentCount[0]++] = s;   // writes into shared array

        cache.recordInput(CacheAPI.FIELD_STUDENT_ID,   studentId);
        cache.recordInput(CacheAPI.FIELD_STUDENT_NAME, s.getStudentName());
        cache.cacheSearchResult(CacheAPI.TYPE_STUDENT, studentId,
                studentId + " – " + s.getStudentName());

        System.out.println("Student added. Total: " + studentCount[0] + "/" + MAX_STUDENTS);
    }

    private void displayAllStudents() {
        if (studentCount[0] == 0) { System.out.println("\nNo students stored."); return; }
        System.out.println("\n--- All Students ---");
        for (int i = 0; i < studentCount[0]; i++) {
            System.out.println("\nStudent #" + (i + 1));
            displayStudent(students[i]);
        }
    }

    private void searchStudent() {
        System.out.println("\n--- Search Student ---");

        cache.printSuggestions(CacheAPI.FIELD_STUDENT_ID, "");
        String id = readNonEmptyString("Enter Student ID: ");
        cache.recordInput(CacheAPI.FIELD_STUDENT_ID, id);

        String cached = cache.getCachedResult(CacheAPI.TYPE_STUDENT, id);
        if (cached != null) System.out.println("[Cache hit] " + cached);

        int idx = findStudentIndex(id);
        if (idx == -1) { System.out.println("Student not found."); return; }

        displayStudent(students[idx]);
        cache.cacheSearchResult(CacheAPI.TYPE_STUDENT, id,
                id + " – " + students[idx].getStudentName());
    }

    private void editStudent() {
        System.out.println("\n--- Edit Student ---");

        cache.printSuggestions(CacheAPI.FIELD_STUDENT_ID, "");
        String id = readNonEmptyString("Enter Student ID to edit: ");
        cache.recordInput(CacheAPI.FIELD_STUDENT_ID, id);

        int idx = findStudentIndex(id);
        if (idx == -1) { System.out.println("Student not found."); return; }

        Student s = students[idx];
        System.out.println("\nCurrent details:");
        displayStudent(s);
        System.out.println("\n[Leave blank to keep current value. Student ID cannot be changed.]");

        String fn = readOptionalString("New first name (" + s.getFirstName() + "): ");
        if (!fn.isEmpty()) s.setFirstName(fn);

        String ln = readOptionalString("New last name (" + s.getLastName() + "): ");
        if (!ln.isEmpty()) s.setLastName(ln);

        String em = readOptionalString("New email (" + s.getEmail() + "): ");
        if (!em.isEmpty()) s.setEmail(em);

        String ph = readOptionalString("New phone (" + s.getPhoneNumber() + "): ");
        if (!ph.isEmpty()) s.setPhoneNumber(ph);

        cache.recordInput(CacheAPI.FIELD_STUDENT_NAME, s.getStudentName());
        cache.cacheSearchResult(CacheAPI.TYPE_STUDENT, id,
                id + " – " + s.getStudentName());
        System.out.println("Student updated.");
    }

    private void deleteStudent() {
        if (studentCount[0] == 0) { System.out.println("No students to delete."); return; }

        cache.printSuggestions(CacheAPI.FIELD_STUDENT_ID, "");
        String id = readNonEmptyString("Enter Student ID to delete: ");
        cache.recordInput(CacheAPI.FIELD_STUDENT_ID, id);

        int idx = findStudentIndex(id);
        if (idx == -1) { System.out.println("Student not found."); return; }

        displayStudent(students[idx]);
        String confirm = readNonEmptyString("Confirm deletion? (Yes/No): ");
        if (!confirm.equalsIgnoreCase("Yes")) { System.out.println("Cancelled."); return; }

        for (int i = idx; i < studentCount[0] - 1; i++) students[i] = students[i + 1];
        students[--studentCount[0]] = null;

        cache.evict(CacheAPI.TYPE_STUDENT, id);
        System.out.println("Student deleted.");
    }

    // ── Helpers ────────────────────────────────────────────────────

    private int findStudentIndex(String id) {
        for (int i = 0; i < studentCount[0]; i++)
            if (students[i].getStudentId().equalsIgnoreCase(id)) return i;
        return -1;
    }

    private void displayStudent(Student s) {
        System.out.println("  Name         : " + s.getFirstName() + " " + s.getLastName());
        System.out.println("  Student ID   : " + s.getStudentId());
        System.out.println("  Email        : " + s.getEmail());
        System.out.println("  Phone        : " + s.getPhoneNumber());
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
