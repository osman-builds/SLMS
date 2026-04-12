package com.mycompany.course;



public class Course {

    // Course attributes
    private String courseName;
    private String courseCode;
    private String courseType; // core, elective, university
    private int creditHour;
    private String courseSummary;
    private String msTeamsLink; 

    // Constructor for relationship module requirement
    public Course(String courseCode, String courseName, String courseType) {
        this.courseCode = courseCode;
        this.courseName = courseName;
        this.courseType = normalizeCourseType(courseType);
        this.creditHour = 0;
        this.courseSummary = "";
        this.msTeamsLink = "";
    }

    // Constructor – initialises all attributes
    public Course(String courseName, String courseCode, int creditHour, String courseSummary, String msTeamsLink) {
        this.courseName = courseName;
        this.courseCode = courseCode;
        this.courseType = "core";
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

    public String getCourseType() {
        return courseType;
    }

    public void setCourseType(String courseType) {
        this.courseType = normalizeCourseType(courseType);
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

    private String normalizeCourseType(String value) {
        if (value == null) {
            return "core";
        }

        String normalized = value.trim().toLowerCase();
        if (normalized.equals("core") || normalized.equals("elective") || normalized.equals("university")) {
            return normalized;
        }
        return "core";
    }
}
