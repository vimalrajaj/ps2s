// Test API endpoints
async function testAPIs() {
    console.log('Testing API endpoints...');
    
    try {
        // Test departments API
        console.log('1. Testing /api/departments');
        const deptResponse = await fetch('/api/departments');
        const deptData = await deptResponse.json();
        console.log('Departments response:', deptData);
        
        if (deptData.success && deptData.departments.length > 0) {
            const firstDept = deptData.departments[0];
            console.log('First department:', firstDept);
            
            // Test department details API
            console.log(`2. Testing /api/departments/${firstDept.id}/details`);
            const detailsResponse = await fetch(`/api/departments/${firstDept.id}/details`);
            const detailsData = await detailsResponse.json();
            console.log('Department details response:', detailsData);
            
            if (detailsData.success && detailsData.academicYears.length > 0) {
                const firstYear = detailsData.academicYears[0];
                console.log('First academic year:', firstYear);
                
                // Test classes API
                console.log(`3. Testing /api/academic-years/${firstYear.id}/classes`);
                const classesResponse = await fetch(`/api/academic-years/${firstYear.id}/classes`);
                const classesData = await classesResponse.json();
                console.log('Classes response:', classesData);
                
                // If classes are found, populate dropdowns manually for testing
                if (classesData.success && classesData.classes.length > 0) {
                    setTimeout(() => {
                        populateTestData(deptData.departments, detailsData.academicYears, classesData.classes);
                    }, 2000);
                }
            } else {
                console.log('No academic years found for department');
            }
        } else {
            console.log('No departments found');
        }
    } catch (error) {
        console.error('API test error:', error);
    }
}

// Manually populate dropdowns for testing
function populateTestData(departments, academicYears, classes) {
    console.log('Populating test data...');
    
    // Populate departments
    const deptSelect = document.getElementById('department');
    if (deptSelect && departments.length > 0) {
        deptSelect.innerHTML = '<option value="">Select Department</option>';
        departments.forEach(dept => {
            deptSelect.innerHTML += `<option value="${dept.id}">${dept.name} (${dept.code})</option>`;
        });
        console.log('Departments populated:', departments.length);
        
        // Auto-select first department
        deptSelect.value = departments[0].id;
        
        // Populate academic years
        const yearSelect = document.getElementById('academicYear');
        if (yearSelect && academicYears.length > 0) {
            yearSelect.innerHTML = '<option value="">Select Academic Year</option>';
            academicYears.forEach(year => {
                yearSelect.innerHTML += `<option value="${year.id}">${year.year_range}</option>`;
            });
            console.log('Academic years populated:', academicYears.length);
            
            // Auto-select first academic year
            yearSelect.value = academicYears[0].id;
            
            // Populate classes
            const classSelect = document.getElementById('studentClass');
            if (classSelect && classes.length > 0) {
                classSelect.innerHTML = '<option value="">Select Class & Section</option>';
                classes.forEach(cls => {
                    const capacity = cls.capacity || 60;
                    const currentStrength = cls.current_strength || 0;
                    const availableSlots = capacity - currentStrength;
                    const statusText = availableSlots > 0 ? `(${availableSlots} slots available)` : '(Full)';
                    
                    classSelect.innerHTML += `<option value="${cls.id}">${cls.class_name} - Section ${cls.section} ${statusText}</option>`;
                });
                console.log('Classes populated:', classes.length);
                
                // Update debug info
                const debugDiv = document.getElementById('debugClasses');
                if (debugDiv) {
                    debugDiv.textContent = `✅ Test: Loaded ${classes.length} classes successfully!`;
                    debugDiv.style.color = 'green';
                }
            }
        }
    }
}

// Run test when DOM is loaded
document.addEventListener('DOMContentLoaded', testAPIs);