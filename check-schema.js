const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkSchema() {
    console.log('🔍 Checking faculty table structure...');
    
    // Get one faculty record to see the structure
    const { data: faculty, error: facultyError } = await supabase
        .from('faculty')
        .select('*')
        .limit(1);
    
    if (facultyError) {
        console.error('Faculty error:', facultyError);
    } else {
        console.log('Faculty structure:', faculty[0] ? Object.keys(faculty[0]) : 'No records');
    }
    
    console.log('\n🔍 Checking departments table structure...');
    const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .limit(1);
    
    if (deptError) {
        console.error('Departments error:', deptError);
    } else {
        console.log('Departments structure:', departments[0] ? Object.keys(departments[0]) : 'No records');
    }
    
    console.log('\n🔍 Checking students table structure...');
    const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .limit(1);
    
    if (studentsError) {
        console.error('Students error:', studentsError);
    } else {
        console.log('Students structure:', students[0] ? Object.keys(students[0]) : 'No records');
    }
    
    console.log('\n🔍 Checking classes table structure...');
    const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .limit(1);
    
    if (classesError) {
        console.error('Classes error:', classesError);
    } else {
        console.log('Classes structure:', classes[0] ? Object.keys(classes[0]) : 'No records');
    }
}

checkSchema().catch(console.error);