// Database initialization script for Railway deployment
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  // Database configuration for Railway
  const dbConfig = {
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASS || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'university_management',
    port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
    multipleStatements: true
  };

  try {
    console.log('🔄 Initializing database...');
    const connection = await mysql.createConnection(dbConfig);

    // Check if tables exist
    const [tables] = await connection.execute("SHOW TABLES");
    
    if (tables.length === 0) {
      console.log('📊 No tables found. Creating database schema...');
      
      // Read and execute schema
      const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      await connection.query(schemaSQL);
      console.log('✅ Schema created successfully');

      // Read and execute dummy data
      const dummyDataSQL = fs.readFileSync(path.join(__dirname, 'add_complete_dummy_data.sql'), 'utf8');
      await connection.query(dummyDataSQL);
      console.log('✅ Dummy data inserted successfully');
    } else {
      console.log('✅ Database already initialized with', tables.length, 'tables');
    }

    await connection.end();
    console.log('🎉 Database initialization completed!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

module.exports = { initializeDatabase };