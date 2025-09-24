// Database Setup Script - Rebuild from scratch
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'university_management',
  multipleStatements: true
});

async function setupDatabase() {
  console.log('🔄 Setting up fresh database...\n');

  try {
    // Connect to database
    await new Promise((resolve, reject) => {
      db.connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Connected to database\n');

    // Drop all existing tables
    console.log('🗑️ Dropping all existing tables...');
    await new Promise((resolve, reject) => {
      db.query(`
        SET FOREIGN_KEY_CHECKS = 0;
        DROP TABLE IF EXISTS students, faculty, admin, users, departments, classes, courses, academic_years, sessions;
        SET FOREIGN_KEY_CHECKS = 1;
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ All tables dropped\n');

    // Create admin table
    console.log('📋 Creating admin table...');
    await new Promise((resolve, reject) => {
      db.query(`
        CREATE TABLE admin (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Admin table created');

    // Insert admin user
    await new Promise((resolve, reject) => {
      db.query(`INSERT INTO admin (username, password) VALUES ('admin', 'admin')`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Admin user created (username: admin, password: admin)\n');

    // Create students table - simple structure matching form fields
    console.log('👨‍🎓 Creating students table...');
    await new Promise((resolve, reject) => {
      db.query(`
        CREATE TABLE students (
          id INT AUTO_INCREMENT PRIMARY KEY,
          register_number VARCHAR(50) UNIQUE NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(150) UNIQUE NOT NULL,
          phone VARCHAR(15),
          date_of_birth DATE NOT NULL,
          gender ENUM('Male', 'Female', 'Other') NOT NULL,
          department VARCHAR(100) NOT NULL,
          current_semester INT DEFAULT 1,
          current_year INT DEFAULT 1,
          parent_name VARCHAR(100),
          parent_phone VARCHAR(15),
          parent_email VARCHAR(150),
          address TEXT,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Students table created\n');

    // Create faculty table - simple structure matching form fields
    console.log('👨‍🏫 Creating faculty table...');
    await new Promise((resolve, reject) => {
      db.query(`
        CREATE TABLE faculty (
          id INT AUTO_INCREMENT PRIMARY KEY,
          faculty_code VARCHAR(50) UNIQUE NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(150) UNIQUE NOT NULL,
          phone VARCHAR(15),
          date_of_birth DATE,
          gender ENUM('Male', 'Female', 'Other'),
          department VARCHAR(100) NOT NULL,
          designation ENUM('Assistant Professor', 'Associate Professor', 'Professor', 'HOD', 'Dean', 'Principal') NOT NULL,
          qualification VARCHAR(200),
          experience_years INT DEFAULT 0,
          date_of_joining DATE,
          password VARCHAR(255) NOT NULL,
          status ENUM('active', 'inactive') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Faculty table created\n');

    console.log('🎉 Database setup completed successfully!\n');
    console.log('📊 Summary:');
    console.log('   - Admin table: ✅ Created with admin/admin login');
    console.log('   - Students table: ✅ Created (matches form fields)');
    console.log('   - Faculty table: ✅ Created (matches form fields)');
    console.log('   - No complex foreign keys: ✅ Simple structure');
    console.log('\n🔑 Admin Login: username=admin, password=admin');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
  } finally {
    db.end();
  }
}

setupDatabase();