package com.mycompany.course;



public class Student {

    // student attributes
    private String firstName;
    private String lastName;
    private String studentId;  // cannot be changed after student is created
    private String email;
    private String phoneNumber;

    // constructor to set all student details when a new student is created
    public Student(String firstName, String lastName, String studentId, String email, String phoneNumber) {
        this.firstName   = firstName;
        this.lastName    = lastName;
        this.studentId   = studentId;
        this.email       = email;
        this.phoneNumber = phoneNumber;
    }

    // --- Getters ---
    // these methods are used to get the value of each attribute

    // returns the first name of the student
    public String getFirstName() {
        return firstName;
    }

    // returns the last name of the student
    public String getLastName() {
        return lastName;
    }

    // returns the student ID
    // no setter for this one because student ID should not be editable
    public String getStudentId() {
        return studentId;
    }

    // returns the email of the student
    public String getEmail() {
        return email;
    }

    // returns the phone number of the student
    public String getPhoneNumber() {
        return phoneNumber;
    }

    // --- Setters ---
    // these methods are used to update the value of each attribute
    // studentId has no setter because it must stay the same after creation

    // updates the first name
    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    // updates the last name
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    // updates the email
    public void setEmail(String email) {
        this.email = email;
    }

    // updates the phone number
    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }
}
