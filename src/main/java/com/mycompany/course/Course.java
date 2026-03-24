package com.mycompany.course;



public class Course {

    // Course attributes
    private String courseName;
    private String courseCode;
    private int creditHour;
    private String courseSummary;
    private String msTeamsLink;

    // Constructor – initialises all attributes
    public Course(String courseName, String courseCode, int creditHour, String courseSummary, String msTeamsLink) {
        this.courseName = courseName;
        this.courseCode = courseCode;
        this.creditHour = creditHour;
        this.courseSummary = courseSummary;
        this.msTeamsLink = msTeamsLink;
    }

    // Getters and Setters
    public String getCourseName() {
        return courseName;
    }

    public void setCourseName(String courseName) {
        this.courseName = courseName;
    }

    public String getCourseCode() {
        return courseCode;
    }

    public void setCourseCode(String courseCode) {
        this.courseCode = courseCode;
    }

    public int getCreditHour() {
        return creditHour;
    }

    public void setCreditHour(int creditHour) {
        this.creditHour = creditHour;
    }

    public String getCourseSummary() {
        return courseSummary;
    }

    public void setCourseSummary(String courseSummary) {
        this.courseSummary = courseSummary;
    }

    public String getMsTeamsLink() {
        return msTeamsLink;
    }

    public void setMsTeamsLink(String msTeamsLink) {
        this.msTeamsLink = msTeamsLink;
    }
}