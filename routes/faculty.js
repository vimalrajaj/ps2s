const express = require('express');
const router = express.Router();

router.post('/faculty', async (req, res) => {
    try {
        const { faculty_code, first_name, last_name, email, department, designation, password } = req.body;

        if (!faculty_code || !first_name || !last_name || !email || !department || !designation) {
            return res.status(400).json({ 
                success: false, 
                message: 'Required fields missing' 
            });
        }

        const facultyPassword = password || faculty_code;

        await req.dbPool.execute(
            'INSERT INTO faculty (faculty_code, first_name, last_name, email, department, designation, password, status) VALUES (?, ?, ?, ?, ?, ?, ?, "active")',
            [faculty_code, first_name, last_name, email, department, designation, facultyPassword]
        );

        res.status(201).json({
            success: true,
            message: 'Faculty created successfully'
        });

    } catch (error) {
        console.error('Error creating faculty:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
