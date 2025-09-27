# University Management System

A comprehensive university management system built with Node.js, Express, and MySQL. This system supports university administrators, faculty, and students with role-based access control.

## Features

- **University Portal**: Admin dashboard with student, faculty, and department management
- **Faculty Dashboard**: Faculty can view their assigned students, manage classes, and verify certificates
- **Student Portal**: Students can view their profile, courses, and certificates
- **Authentication**: Role-based access control for different user types
- **Database Management**: Complete MySQL database with relationships
- **Certificate Verification**: QR code and OCR-based certificate verification

## Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- Git

## Installation Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sanjay6383/sih.git
   cd sih
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup MySQL Database**
   - Create a database named `university_management`
   - Import your existing database or create the required tables

4. **Configure Environment Variables**
   Edit `.env` with your database credentials:
   ```
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASS=your_mysql_password
   DB_NAME=university_management
   ```

5. **Start the application**
   ```bash
   npm start
   ```

6. **Access the application**
   Open http://localhost:3000 in your browser

## 🔑 Login Credentials

### **Admin Login:**
- **URL**: http://localhost:3000/login
- **Username**: `admin`
- **Password**: `admin123`

### **Faculty Logins:**
1. **Dr. Rajesh Kumar (CSE Head)**
   - **Username**: `rajesh.kumar`
   - **Password**: `faculty123`
   - **Permissions**: Can manage students and create accounts

2. **Dr. Priya Sharma (ECE Associate Professor)**
   - **Username**: `priya.sharma`
   - **Password**: `faculty123`
   - **Permissions**: Can manage students and create accounts

3. **Dr. Amit Singh (ME Assistant Professor)**
   - **Username**: `amit.singh`
   - **Password**: `faculty123`
   - **Permissions**: Basic faculty privileges

### **Student Logins:**
1. **John Doe (CSE, 4th Year)**
   - **Username**: `21CSE001`
   - **Password**: `student123`
   - **CGPA**: 8.50

2. **Jane Smith (CSE, 4th Year)**
   - **Username**: `21CSE002`
   - **Password**: `student123`
   - **CGPA**: 9.20

3. **Alex Johnson (ECE, 4th Year)**
   - **Username**: `21ECE001`
   - **Password**: `student123`
   - **CGPA**: 7.80

4. **Priya Patel (CSE, 3rd Year)**
   - **Username**: `22CSE001`
   - **Password**: `student123`
   - **CGPA**: 8.90

5. **Rahul Gupta (IT, 3rd Year)**
   - **Username**: `22IT001`
   - **Password**: `student123`
   - **CGPA**: 8.10

## 🌐 Accessing Different Modules

### **Main Login Page**
- **URL**: http://localhost:3000/ or http://localhost:3000/login
- **Features**: Role-based login with demo credentials

### **Student Dashboard**
- **URL**: http://localhost:3000/student-dashboard (after student login)
- **Features**: 
  - Personal progress tracking
  - Certificate management
  - Notifications
  - Academic performance
  - Attendance overview
  - Digital portfolio

### **Faculty Dashboard**
- **URL**: http://localhost:3000/faculty-dashboard (after faculty login)
- **Features**:
  - Student management
  - Certificate verification
  - Create new student accounts
  - Reports and analytics
  - Dashboard statistics

### **Certificate Verification (Standalone)**
- **URL**: http://localhost:3000/certificate_verification
- **Features**:
  - QR code detection (enhanced for small QR codes)
  - OCR text extraction
  - Online certificate verification
  - Support for Credly, Unstop, and other platforms

## 📁 Project Structure

```
sih/
├── server.js                          # Main server file with all APIs
├── package.json                       # Dependencies and scripts
├── database/
│   └── university_database.sql        # Complete MySQL database schema
├── login/
│   └── index.html                     # Login page with role-based authentication
├── student_page/
│   ├── index.html                     # Student dashboard UI
│   ├── style.css                      # Student dashboard styling
│   └── script.js                      # Student dashboard functionality
├── faculty_page/
│   ├── index.html                     # Faculty dashboard UI
│   └── faculty-script.js              # Faculty dashboard functionality
├── certificate_verification/
│   └── public/
│       ├── index.html                 # Certificate verification UI
│       ├── script.js                  # Verification logic
│       └── style.css                  # Verification styling
├── uploads/                           # Certificate upload directory
└── temp/                              # Temporary files directory
```

## 🔧 Key Features Implemented

### **Authentication System**
- ✅ MySQL-based user authentication
- ✅ Session management with express-session
- ✅ Role-based access control (student/faculty/admin)
- ✅ Password hashing with bcrypt
- ✅ Protected routes middleware

### **Student Dashboard**
- ✅ Personalized welcome with real student data
- ✅ Dynamic CGPA, certificates, and attendance display
- ✅ Real-time progress tracking
- ✅ Interactive notifications system
- ✅ Certificate management with verification status
- ✅ Academic performance visualization

### **Faculty Dashboard**
- ✅ Student management interface
- ✅ Certificate verification system
- ✅ Create new student accounts
- ✅ Dashboard statistics and analytics
- ✅ Search and filter functionality
- ✅ Reports generation

### **Certificate Verification**
- ✅ Enhanced QR code detection (12 attempts + grid scanning)
- ✅ OCR text extraction with error correction
- ✅ Support for small QR codes
- ✅ Online verification with Puppeteer browser automation
- ✅ Multiple platform support (Credly, Unstop, generic)

### **Database Integration**
- ✅ Complete MySQL schema with relationships
- ✅ Sample data for testing
- ✅ Stored procedures for complex operations
- ✅ Views for easy data access
- ✅ Proper indexing and constraints

## 🛡️ Security Features

1. **Password Security**: All passwords are hashed using bcrypt
2. **Session Management**: Secure session handling with MySQL store
3. **Route Protection**: Authentication middleware protects all sensitive routes
4. **Role-based Access**: Different access levels for students, faculty, and admin
5. **SQL Injection Prevention**: Prepared statements used throughout
6. **Input Validation**: Server-side validation for all user inputs

## 🎨 UI/UX Features

1. **Responsive Design**: Works on desktop, tablet, and mobile devices
2. **Modern Interface**: Clean, professional design with gradients and animations
3. **Interactive Elements**: Hover effects, transitions, and loading states
4. **Accessibility**: Keyboard navigation support and proper ARIA labels
5. **User Feedback**: Toast notifications, loading indicators, and error messages

## 🔄 Testing the System

### **Test Student Login:**
1. Go to http://localhost:3000/login
2. Select "Student" role
3. Use any demo credentials (e.g., `21CSE001` / `student123`)
4. Explore the student dashboard features

### **Test Faculty Login:**
1. Select "Faculty" role
2. Use faculty credentials (e.g., `rajesh.kumar` / `faculty123`)
3. Try creating a new student account
4. Verify existing certificates

### **Test Certificate Verification:**
1. Go to http://localhost:3000/certificate_verification
2. Upload a certificate image with QR code
3. Test OCR functionality with certificates containing URLs

## 🚨 Troubleshooting

### **Common Issues:**

1. **Database Connection Error:**
   - Check MySQL server is running
   - Verify database credentials in `server.js`
   - Ensure `university_management` database exists

2. **Session Issues:**
   - Clear browser cookies and localStorage
   - Restart the server
   - Check session store configuration

3. **Certificate Upload Errors:**
   - Ensure `uploads/` and `temp/` directories exist
   - Check file permissions
   - Verify supported image formats (PNG, JPG, JPEG)

4. **Module Not Found:**
   - Run `npm install` to ensure all dependencies are installed
   - Check Node.js version (should be v16+)

### **If Puppeteer Installation Fails:**
```bash
npm install puppeteer --unsafe-perm=true --allow-root
```

## 📈 Future Enhancements

1. **Email Notifications**: SMTP integration for automated emails
2. **File Management**: Document upload and storage system
3. **Advanced Analytics**: Charts and graphs for performance tracking
4. **Mobile App**: React Native or Flutter mobile application
5. **API Documentation**: Swagger/OpenAPI documentation
6. **Backup System**: Automated database backups
7. **Logging System**: Comprehensive error and activity logging

## 🤝 Support

For any issues or questions:
1. Check the troubleshooting section above
2. Review the database schema in `university_database.sql`
3. Examine the server logs in the console
4. Verify all dependencies are properly installed

## 📝 Change Log

- **v1.0**: Initial university management system
- **v2.0**: Added authentication and database integration
- **v3.0**: Enhanced certificate verification with small QR code support
- **v4.0**: Complete faculty dashboard and student management
- **v5.0**: Integrated student profile system with real-time data

---

**Project Status**: ✅ **Production Ready**

All major features implemented and tested. The system is ready for deployment with proper security measures and user management.