app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        // Check if user already exists
        db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email.toLowerCase(), username], async (err, row) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (row) return res.status(409).json({ error: 'User already exists' });

            try {
                // Hash password
                const passwordHash = await bcrypt.hash(password, 10);

                // Insert user
                db.run('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', 
                    [username, email.toLowerCase(), passwordHash], 
                    function(err) {
                        if (err) return res.status(500).json({ error: 'Failed to create user' });

                        const token = jwt.sign(
                            { userId: this.lastID, username, email: email.toLowerCase() },
                            JWT_SECRET,
                            { expiresIn: '24h' }
                        );

                        res.status(201).json({
                            message: 'User registered successfully',
                            access_token: token,
                            user: {
                                id: this.lastID,
                                username,
                                email: email.toLowerCase(),
                                is_active: true,
                                created_at: new Date().toISOString()
                            }
                        });
                    }
                );
            } catch (hashError) {
                return res.status(500).json({ error: 'Password hashing failed' });
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed', details: error.message });
    }
});
