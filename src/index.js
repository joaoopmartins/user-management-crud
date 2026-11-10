const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db');

const port = process.env.PORT || 8080;
const app = express();

app.use(express.json());
app.use(cors());

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '../public')));

// List all users
app.get('/api/users', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, fname, lname, created_at FROM users ORDER BY id ASC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID supplied' });
    }

    try {
        const { rows } = await pool.query('SELECT id, fname, lname, created_at FROM users WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create user
app.post('/api/users', async (req, res) => {
    const { fname, lname } = req.body;
    if (!fname?.trim() || !lname?.trim()) {
        return res.status(400).json({ error: 'First name and last name are required' });
    }

    try {
        const { rows } = await pool.query(
            'INSERT INTO users (fname, lname) VALUES ($1, $2) RETURNING id, fname, lname, created_at',
            [fname.trim(), lname.trim()]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { fname, lname } = req.body;

    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID supplied' });
    }
    if (!fname?.trim() || !lname?.trim()) {
        return res.status(400).json({ error: 'First name and last name are required' });
    }

    try {
        const { rows } = await pool.query(
            'UPDATE users SET fname = $1, lname = $2 WHERE id = $3 RETURNING id, fname, lname, created_at',
            [fname.trim(), lname.trim(), id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID supplied' });
    }

    try {
        const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running and listening on port ${port}`);
});