-- Create database tables for academic performance tracking

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(20) NOT NULL UNIQUE,
    semester INT NOT NULL,
    department_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Internal Assessment table
CREATE TABLE IF NOT EXISTS internal_assessments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ia_number INT NOT NULL,
    subject_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    semester INT NOT NULL,
    class_id INT NOT NULL,
    faculty_id INT NOT NULL,
    max_marks INT DEFAULT 20,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (faculty_id) REFERENCES faculty(id),
    UNIQUE KEY unique_ia (ia_number, subject_id, academic_year_id, semester, class_id)
);

-- Student Marks table
CREATE TABLE IF NOT EXISTS student_marks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    internal_assessment_id INT NOT NULL,
    marks_obtained DECIMAL(5,2) DEFAULT 0,
    attendance_status ENUM('Present', 'Absent') DEFAULT 'Present',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (internal_assessment_id) REFERENCES internal_assessments(id),
    UNIQUE KEY unique_student_ia (student_id, internal_assessment_id)
);

-- Insert sample subjects
INSERT IGNORE INTO subjects (subject_name, subject_code, semester, department_id) VALUES 
('Data Structures and Algorithms', 'CSE301', 3, 1),
('Database Management Systems', 'CSE302', 3, 1),
('Operating Systems', 'CSE303', 3, 1),
('Computer Networks', 'CSE304', 3, 1),
('Software Engineering', 'CSE305', 3, 1),
('Web Technologies', 'CSE306', 3, 1),
('Digital Signal Processing', 'ECE301', 3, 2),
('Microprocessors', 'ECE302', 3, 2);

-- Insert sample internal assessments
INSERT IGNORE INTO internal_assessments (ia_number, subject_id, academic_year_id, semester, class_id, faculty_id) VALUES 
(1, 1, 1, 3, 1, 3),  -- IA1 for DSA, CSE Section A
(2, 1, 1, 3, 1, 3),  -- IA2 for DSA, CSE Section A
(1, 2, 1, 3, 1, 3),  -- IA1 for DBMS, CSE Section A
(2, 2, 1, 3, 1, 3);  -- IA2 for DBMS, CSE Section A

-- Insert sample marks for students
INSERT IGNORE INTO student_marks (student_id, internal_assessment_id, marks_obtained, attendance_status) VALUES 
(1, 1, 18.5, 'Present'),  -- Sanjay V - DSA IA1
(2, 1, 16.0, 'Present'),  -- xyz d - DSA IA1
(3, 1, 19.5, 'Present'),  -- Vimal Javakumar - DSA IA1
(1, 2, 17.0, 'Present'),  -- Sanjay V - DSA IA2
(2, 2, 15.5, 'Present'),  -- xyz d - DSA IA2
(3, 2, 18.0, 'Present'),  -- Vimal Javakumar - DSA IA2
(1, 3, 16.5, 'Present'),  -- Sanjay V - DBMS IA1
(2, 3, 14.0, 'Present'),  -- xyz d - DBMS IA1
(3, 3, 19.0, 'Present');  -- Vimal Javakumar - DBMS IA1