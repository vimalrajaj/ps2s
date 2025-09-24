const express = require('express');
const router = express.Router();

router.post('/students', async (req, res) => {
    try {
        const { register_number, first_name, last_name, email, department, password } = req.body;

        if (!register_number || !first_name || !last_name || !email || !department) {
            return res.status(400).json({ 
                success: false, 
                message: 'Required fields missing' 
            });
        }

        const studentPassword = password || register_number;

        await req.dbPool.execute(
            'INSERT INTO students (register_number, first_name, last_name, email, department, password) VALUES (?, ?, ?, ?, ?, ?)',
            [register_number, first_name, last_name, email, department, studentPassword]
        );

        res.status(201).json({
            success: true,
            message: 'Student created successfully'
        });

    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
