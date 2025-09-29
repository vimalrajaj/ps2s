-- Add dummy data without duplicating existing entries
USE university_management;

-- Add more faculty members (checking if faculty_code exists)
INSERT IGNORE INTO faculty (faculty_code, first_name, last_name, email, phone, department, designation, qualification, experience_years, date_of_joining, status, password) VALUES
-- CSE Faculty
('CSE001', 'Arjun', 'Patel', 'arjun.patel@university.edu', '9876543210', 'CSE', 'Professor', 'Ph.D in Computer Science', 12, '2015-06-15', 'active', '12345678'),
('CSE002', 'Kavya', 'Nair', 'kavya.nair@university.edu', '9876543211', 'CSE', 'Associate Professor', 'M.Tech, Ph.D', 8, '2018-07-20', 'active', '12345678'),
('CSE003', 'Ravi', 'Kumar', 'ravi.kumar@university.edu', '9876543212', 'CSE', 'Assistant Professor', 'M.Tech in Software Engineering', 5, '2020-08-01', 'active', '12345678'),

-- ME Faculty  
('ME001', 'Sunil', 'Singh', 'sunil.singh@university.edu', '9876543213', 'ME', 'Professor', 'Ph.D in Mechanical Engineering', 15, '2012-05-10', 'active', '12345678'),
('ME002', 'Deepika', 'Gupta', 'deepika.gupta@university.edu', '9876543214', 'ME', 'Associate Professor', 'M.Tech in Thermal Engineering', 7, '2019-03-15', 'active', '12345678'),

-- EEE Faculty
('EEE001', 'Vikram', 'Raj', 'vikram.raj@university.edu', '9876543215', 'EEE', 'Professor', 'Ph.D in Electrical Engineering', 14, '2013-04-20', 'active', '12345678'),
('EEE002', 'Meera', 'Joshi', 'meera.joshi@university.edu', '9876543216', 'EEE', 'Assistant Professor', 'M.Tech in Power Systems', 4, '2021-06-10', 'active', '12345678'),

-- IT Faculty
('IT001', 'Kiran', 'Verma', 'kiran.verma@university.edu', '9876543217', 'IT', 'Professor', 'Ph.D in Information Technology', 11, '2016-02-28', 'active', '12345678'),
('IT002', 'Sneha', 'Agarwal', 'sneha.agarwal@university.edu', '9876543218', 'IT', 'Associate Professor', 'M.Tech in Data Science', 6, '2020-01-15', 'active', '12345678'),

-- ECE Faculty
('ECE001', 'Manoj', 'Tiwari', 'manoj.tiwari@university.edu', '9876543219', 'ECE', 'Professor', 'Ph.D in Electronics', 13, '2014-09-05', 'active', '12345678'),
('ECE002', 'Pooja', 'Mehta', 'pooja.mehta@university.edu', '9876543220', 'ECE', 'Assistant Professor', 'M.Tech in VLSI Design', 3, '2022-07-01', 'active', '12345678');

-- Add more classes for different departments
INSERT IGNORE INTO classes (class_name, section, department_id, academic_year_id, total_students, class_teacher, room_number, status) VALUES
-- For CSE department (id=7) and academic year (id=7)
('Second Year CSE', 'A', 7, 7, 45, 'Dr. Arjun Patel', '201', 'active'),
('Second Year CSE', 'B', 7, 7, 42, 'Prof. Kavya Nair', '202', 'active'),
('Third Year CSE', 'A', 7, 7, 38, 'Dr. Ravi Kumar', '301', 'active'),

-- For ME department (id=8)
('First Year ME', 'A', 8, 7, 50, 'Dr. Sunil Singh', '101-ME', 'active'),
('Second Year ME', 'A', 8, 7, 47, 'Prof. Deepika Gupta', '201-ME', 'active'),

-- For EEE department (id=9)  
('First Year EEE', 'A', 9, 7, 48, 'Dr. Vikram Raj', '101-EEE', 'active'),
('Second Year EEE', 'A', 9, 7, 45, 'Prof. Meera Joshi', '201-EEE', 'active'),

-- For IT department (id=10)
('First Year IT', 'A', 10, 7, 52, 'Dr. Kiran Verma', '101-IT', 'active'),
('Second Year IT', 'A', 10, 7, 49, 'Prof. Sneha Agarwal', '201-IT', 'active'),

-- For ECE department (id=11)
('First Year ECE', 'A', 11, 7, 46, 'Dr. Manoj Tiwari', '101-ECE', 'active'),
('Second Year ECE', 'A', 11, 7, 44, 'Prof. Pooja Mehta', '201-ECE', 'active');

-- Add comprehensive student data with complete information
INSERT IGNORE INTO students (first_name, last_name, email, phone, date_of_birth, gender, address, roll_number, register_number, department, class_id, current_year, current_semester, admission_year, status, program, student_type, parent_name, parent_phone, emergency_contact, enrollment_date, expected_graduation, fee_status, password) VALUES

-- Students for existing CSE class (id=12)
('Rahul', 'Sharma', 'rahul.sharma@student.edu', '9123456789', '2003-05-15', 'Male', '123 Main Street, Chennai', 'CSE001', '2024CSE001', 'CSE', 12, 1, 1, 2024, 'active', 'B.Tech Computer Science', 'Regular', 'Mr. Vinod Sharma', '9876501234', '9876501235', '2024-07-01', '2028-06-30', 'Paid', '12345678'),
('Priya', 'Reddy', 'priya.reddy@student.edu', '9123456790', '2003-08-22', 'Female', '456 Park Avenue, Chennai', 'CSE002', '2024CSE002', 'CSE', 12, 1, 1, 2024, 'active', 'B.Tech Computer Science', 'Regular', 'Mr. Krishna Reddy', '9876501236', '9876501237', '2024-07-01', '2028-06-30', 'Paid', '12345678'),
('Amit', 'Singh', 'amit.singh@student.edu', '9123456791', '2003-03-10', 'Male', '789 College Road, Chennai', 'CSE003', '2024CSE003', 'CSE', 12, 1, 1, 2024, 'active', 'B.Tech Computer Science', 'Regular', 'Mr. Rajesh Singh', '9876501238', '9876501239', '2024-07-01', '2028-06-30', 'Partial', '12345678'),
('Sneha', 'Patel', 'sneha.patel@student.edu', '9123456792', '2003-12-05', 'Female', '321 Gandhi Street, Chennai', 'CSE004', '2024CSE004', 'CSE', 12, 1, 1, 2024, 'active', 'B.Tech Computer Science', 'Regular', 'Mr. Kiran Patel', '9876501240', '9876501241', '2024-07-01', '2028-06-30', 'Paid', '12345678'),

-- Students for First Year class (id=5)
('Arun', 'Kumar', 'arun.kumar@student.edu', '9123456793', '2004-01-18', 'Male', '654 Anna Nagar, Chennai', 'CSE005', '2025CSE005', 'CSE', 5, 1, 1, 2025, 'active', 'B.Tech Computer Science', 'Regular', 'Mrs. Lakshmi Kumar', '9876501242', '9876501243', '2025-07-01', '2029-06-30', 'Paid', '12345678'),
('Divya', 'Nair', 'divya.nair@student.edu', '9123456794', '2004-06-30', 'Female', '987 T.Nagar, Chennai', 'CSE006', '2025CSE006', 'CSE', 5, 1, 1, 2025, 'active', 'B.Tech Computer Science', 'Regular', 'Mr. Suresh Nair', '9876501244', '9876501245', '2025-07-01', '2029-06-30', 'Paid', '12345678'),
('Rohit', 'Agarwal', 'rohit.agarwal@student.edu', '9123456795', '2004-04-25', 'Male', '147 Velachery, Chennai', 'CSE007', '2025CSE007', 'CSE', 5, 1, 1, 2025, 'active', 'B.Tech Computer Science', 'Regular', 'Mr. Vivek Agarwal', '9876501246', '9876501247', '2025-07-01', '2029-06-30', 'Pending', '12345678'),

-- Students for HTML Fix Test class (id=11)  
('Karthik', 'Raj', 'karthik.raj@student.edu', '9123456796', '2003-09-12', 'Male', '258 Adyar, Chennai', 'CSE008', '2024CSE008', 'CSE', 11, 2, 3, 2023, 'active', 'B.Tech Computer Science', 'Regular', 'Mr. Mohan Raj', '9876501248', '9876501249', '2023-07-01', '2027-06-30', 'Paid', '12345678'),
('Meera', 'Iyer', 'meera.iyer@student.edu', '9123456797', '2003-11-08', 'Female', '369 Mylapore, Chennai', 'CSE009', '2024CSE009', 'CSE', 11, 2, 3, 2023, 'active', 'B.Tech Computer Science', 'Regular', 'Mrs. Radha Iyer', '9876501250', '9876501251', '2023-07-01', '2027-06-30', 'Paid', '12345678'),

-- Add more students for other departments
-- ME Students  
('Suresh', 'Pillai', 'suresh.pillai@student.edu', '9123456798', '2004-02-14', 'Male', '147 Kodambakkam, Chennai', 'ME001', '2025ME001', 'ME', 13, 1, 1, 2025, 'active', 'B.Tech Mechanical', 'Regular', 'Mr. Raman Pillai', '9876501252', '9876501253', '2025-07-01', '2029-06-30', 'Paid', '12345678'),
('Kavitha', 'Raman', 'kavitha.raman@student.edu', '9123456799', '2004-07-20', 'Female', '258 Thiruvanmiyur, Chennai', 'ME002', '2025ME002', 'ME', 13, 1, 1, 2025, 'active', 'B.Tech Mechanical', 'Regular', 'Mrs. Geetha Raman', '9876501254', '9876501255', '2025-07-01', '2029-06-30', 'Paid', '12345678'),

-- EEE Students
('Rajesh', 'Babu', 'rajesh.babu@student.edu', '9123456800', '2004-03-18', 'Male', '369 Porur, Chennai', 'EEE001', '2025EEE001', 'EEE', 15, 1, 1, 2025, 'active', 'B.Tech Electrical', 'Regular', 'Mr. Krishnan Babu', '9876501256', '9876501257', '2025-07-01', '2029-06-30', 'Paid', '12345678'),
('Lakshmi', 'Sundaram', 'lakshmi.sundaram@student.edu', '9123456801', '2004-09-25', 'Female', '147 Tambaram, Chennai', 'EEE002', '2025EEE002', 'EEE', 15, 1, 1, 2025, 'active', 'B.Tech Electrical', 'Regular', 'Mrs. Priya Sundaram', '9876501258', '9876501259', '2025-07-01', '2029-06-30', 'Paid', '12345678'),

-- IT Students
('Manoj', 'Krishna', 'manoj.krishna@student.edu', '9123456802', '2004-05-12', 'Male', '258 Guindy, Chennai', 'IT001', '2025IT001', 'IT', 17, 1, 1, 2025, 'active', 'B.Tech Information Technology', 'Regular', 'Mr. Venkat Krishna', '9876501260', '9876501261', '2025-07-01', '2029-06-30', 'Paid', '12345678'),
('Deepa', 'Menon', 'deepa.menon@student.edu', '9123456803', '2004-11-08', 'Female', '369 Chrompet, Chennai', 'IT002', '2025IT002', 'IT', 17, 1, 1, 2025, 'active', 'B.Tech Information Technology', 'Regular', 'Mrs. Radha Menon', '9876501262', '9876501263', '2025-07-01', '2029-06-30', 'Paid', '12345678'),

-- ECE Students
('Naveen', 'Kumar', 'naveen.kumar@student.edu', '9123456804', '2004-08-15', 'Male', '147 Pallavaram, Chennai', 'ECE001', '2025ECE001', 'ECE', 19, 1, 1, 2025, 'active', 'B.Tech Electronics', 'Regular', 'Mr. Suresh Kumar', '9876501264', '9876501265', '2025-07-01', '2029-06-30', 'Paid', '12345678'),
('Vani', 'Krishnan', 'vani.krishnan@student.edu', '9123456805', '2004-12-22', 'Female', '258 Medavakkam, Chennai', 'ECE002', '2025ECE002', 'ECE', 19, 1, 1, 2025, 'active', 'B.Tech Electronics', 'Regular', 'Mrs. Meena Krishnan', '9876501266', '9876501267', '2025-07-01', '2029-06-30', 'Paid', '12345678');

-- Add subjects for different departments  
INSERT IGNORE INTO subjects (subject_code, subject_name, semester, credits, academic_year, department_id, faculty_id, subject_type, is_elective) VALUES
-- CSE Subjects (department_id = 7)
('CSE101', 'Programming Fundamentals', 1, 4, '2024-25', 7, 8, 'Both', 0),
('CSE102', 'Data Structures', 1, 4, '2024-25', 7, 9, 'Both', 0),
('CSE201', 'Database Management Systems', 3, 4, '2024-25', 7, 10, 'Theory', 0),
('CSE202', 'Computer Networks', 3, 3, '2024-25', 7, 8, 'Theory', 0),
('CSE301', 'Software Engineering', 5, 3, '2024-25', 7, 9, 'Theory', 0),
('CSE401', 'Machine Learning', 7, 4, '2024-25', 7, 10, 'Both', 1),

-- ME Subjects (department_id = 8)
('ME101', 'Engineering Mechanics', 1, 4, '2024-25', 8, 13, 'Theory', 0),
('ME102', 'Thermodynamics', 2, 4, '2024-25', 8, 14, 'Theory', 0),
('ME201', 'Machine Design', 3, 4, '2024-25', 8, 13, 'Both', 0),

-- EEE Subjects (department_id = 9)
('EEE101', 'Circuit Analysis', 1, 4, '2024-25', 9, 15, 'Both', 0),
('EEE102', 'Electromagnetic Fields', 2, 3, '2024-25', 9, 16, 'Theory', 0),
('EEE201', 'Power Systems', 3, 4, '2024-25', 9, 15, 'Theory', 0),

-- Mathematics and Science Subjects
('MAT101', 'Engineering Mathematics I', 1, 4, '2024-25', 7, NULL, 'Theory', 0),
('MAT102', 'Engineering Mathematics II', 2, 4, '2024-25', 7, NULL, 'Theory', 0),
('PHY101', 'Engineering Physics', 1, 3, '2024-25', 7, NULL, 'Both', 0),
('CHE101', 'Engineering Chemistry', 1, 3, '2024-25', 7, NULL, 'Both', 0);

-- Add mentor assignments (checking for faculty_id from newly inserted faculty)
INSERT IGNORE INTO mentor_assignments (faculty_id, class_id, assignment_date, status) VALUES
-- Get the faculty IDs and assign to classes
(8, 12, '2024-07-15', 'active'),  -- First CSE faculty for CSE class
(9, 5, '2025-07-15', 'active'),   -- Second CSE faculty for First Year
(10, 11, '2024-07-15', 'active'), -- Third CSE faculty for HTML Fix Test class
(13, 13, '2025-07-15', 'active'), -- ME faculty for ME class
(15, 15, '2025-07-15', 'active'), -- EEE faculty for EEE class
(17, 17, '2025-07-15', 'active'), -- IT faculty for IT class
(19, 19, '2025-07-15', 'active'); -- ECE faculty for ECE class

-- Update department total counts based on actual data
UPDATE departments SET 
    total_faculty = (SELECT COUNT(*) FROM faculty WHERE faculty.department = departments.dept_code),
    total_students = (SELECT COUNT(*) FROM students WHERE students.department = departments.dept_code)
WHERE id IN (7,8,9,10,11,12);

-- Update class total_students based on actual student count  
UPDATE classes SET 
    total_students = (SELECT COUNT(*) FROM students WHERE students.class_id = classes.id);

SELECT 'Dummy data insertion completed successfully!' AS message;