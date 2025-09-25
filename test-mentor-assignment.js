// Test script for mentor assignment functionality
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function testMentorAssignment() {
    try {
        console.log('🧪 Testing Mentor Assignment Functionality...\n');
        
        // 1. Initialize mentor table
        console.log('1. Initializing mentor table...');
        const initResponse = await fetch(`${BASE_URL}/init-mentor-table`);
        const initResult = await initResponse.json();
        console.log('✅ Init result:', initResult.message);
        
        // 2. First assignment
        console.log('\n2. Assigning first mentor (class_id: 1, faculty_id: 1)...');
        const assignResponse1 = await fetch(`${BASE_URL}/assign-mentor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                class_id: 1,
                faculty_id: 1,
                notes: 'First assignment test'
            })
        });
        
        const assignResult1 = await assignResponse1.json();
        console.log('✅ First assignment result:', assignResult1.message);
        
        // 3. Get assignments
        console.log('\n3. Getting mentor assignments...');
        const getResponse1 = await fetch(`${BASE_URL}/mentor-assignments`);
        const getResult1 = await getResponse1.json();
        console.log('✅ Current assignments:', getResult1.assignments?.length || 0);
        
        if (getResult1.assignments && getResult1.assignments.length > 0) {
            const assignmentId = getResult1.assignments[0].id;
            
            // 4. Remove assignment
            console.log('\n4. Removing mentor assignment...');
            const removeResponse = await fetch(`${BASE_URL}/mentor-assignment/${assignmentId}`, {
                method: 'DELETE'
            });
            const removeResult = await removeResponse.json();
            console.log('✅ Remove result:', removeResult.message);
            
            // 5. Try to assign new mentor (this should work now)
            console.log('\n5. Assigning new mentor to same class (class_id: 1, faculty_id: 2)...');
            const assignResponse2 = await fetch(`${BASE_URL}/assign-mentor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    class_id: 1,
                    faculty_id: 2,
                    notes: 'Second assignment test'
                })
            });
            
            if (assignResponse2.ok) {
                const assignResult2 = await assignResponse2.json();
                console.log('✅ Second assignment result:', assignResult2.message);
            } else {
                const errorText = await assignResponse2.text();
                console.log('❌ Second assignment failed:', errorText);
            }
            
            // 6. Final check
            console.log('\n6. Final mentor assignments check...');
            const getResponse2 = await fetch(`${BASE_URL}/mentor-assignments`);
            const getResult2 = await getResponse2.json();
            console.log('✅ Final assignments:', getResult2.assignments?.length || 0);
            
            if (getResult2.assignments && getResult2.assignments.length > 0) {
                console.log('Current mentor:', getResult2.assignments[0].first_name, getResult2.assignments[0].last_name);
            }
        }
        
        console.log('\n🎉 Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testMentorAssignment();