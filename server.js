const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Videos table
    db.run(`CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        original_filename TEXT,
        file_path TEXT,
        duration REAL,
        status TEXT DEFAULT 'processing',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Video clips table
    db.run(`CREATE TABLE IF NOT EXISTS video_clips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id INTEGER NOT NULL,
        title_suggestion TEXT,
        hashtags TEXT,
        description TEXT,
        start_time REAL,
        end_time REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (video_id) REFERENCES videos (id)
    )`);
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/wmv', 'video/flv', 'video/webm'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only video files are allowed.'));
        }
    }
});

// JWT middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Helper function to generate mock AI content
const generateMockAIContent = (title) => {
    const titles = [
        `🔥 ${title} - You Won't Believe What Happens Next!`,
        `💯 VIRAL: ${title} Breaks the Internet`,
        `🚀 ${title} - This Changes Everything!`,
        `⚡ SHOCKING: ${title} Revealed`,
        `🎯 ${title} - The Ultimate Guide`
    ];

    const hashtags = [
        ['#viral', '#trending', '#amazing', '#mustwatch', '#incredible'],
        ['#fyp', '#foryou', '#trending', '#viral', '#content'],
        ['#shorts', '#viral', '#trending', '#amazing', '#wow'],
        ['#content', '#creator', '#viral', '#trending', '#epic'],
        ['#amazing', '#viral', '#mustwatch', '#trending', '#shorts']
    ];

    const descriptions = [
        `This ${title} video will blow your mind! Don't miss out on this incredible content that everyone is talking about. Like and share if you found this amazing!`,
        `Get ready for the most viral ${title} content you've ever seen! This is exactly what you need to see today. Follow for more amazing content!`,
        `You asked for it, here it is! The ultimate ${title} video that's taking the internet by storm. This is pure gold!`,
        `Breaking: This ${title} video is going viral for all the right reasons! You won't want to miss this incredible moment.`,
        `The ${title} content that everyone is sharing! This is exactly why this video deserves to go viral. Amazing stuff!`
    ];

    const randomIndex = Math.floor(Math.random() * titles.length);
    
    return {
        title_suggestion: titles[randomIndex],
        hashtags: JSON.stringify(hashtags[randomIndex]),
        description: descriptions[randomIndex]
    };
};

// Routes

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, confirm_password } = req.body;

        // Validation
        if (!username || !email || !password || !confirm_password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password !== confirm_password) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Check if user already exists
        db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], async (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (row) {
                return res.status(409).json({ error: 'User already exists' });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Create user
            db.run('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', 
                [username, email.toLowerCase(), passwordHash], 
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to create user' });
                    }

                    // Generate JWT token
                    const token = jwt.sign({ userId: this.lastID, username, email }, JWT_SECRET, { expiresIn: '24h' });

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
        });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed', details: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // Check password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            if (!user.is_active) {
                return res.status(401).json({ error: 'Account is deactivated' });
            }

            // Generate JWT token
            const token = jwt.sign({ userId: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

            res.json({
                message: 'Login successful',
                access_token: token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    is_active: user.is_active,
                    created_at: user.created_at
                }
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
});

// Video processing routes
app.post('/api/shortener/process-youtube', authenticateToken, async (req, res) => {
    try {
        const { url } = req.body;
        const userId = req.user.userId;

        if (!url) {
            return res.status(400).json({ error: 'YouTube URL is required' });
        }

        // Validate YouTube URL
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        if (!youtubeRegex.test(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        // Mock video processing (in real implementation, you'd use ytdl-core and ffmpeg)
        const videoTitle = 'Rick Astley - Never Gonna Give You Up (Official Video)';
        const duration = 212; // seconds

        // Create video record
        db.run('INSERT INTO videos (user_id, title, duration, status) VALUES (?, ?, ?, ?)',
            [userId, videoTitle, duration, 'completed'],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to save video' });
                }

                const videoId = this.lastID;

                // Generate mock clips
                const clips = [];
                const numClips = Math.floor(Math.random() * 3) + 2; // 2-4 clips

                for (let i = 0; i < numClips; i++) {
                    const startTime = Math.floor(Math.random() * (duration - 30));
                    const endTime = startTime + 15 + Math.floor(Math.random() * 15); // 15-30 second clips
                    const aiContent = generateMockAIContent(videoTitle);

                    clips.push({
                        start_time: startTime,
                        end_time: Math.min(endTime, duration),
                        ...aiContent
                    });

                    // Save clip to database
                    db.run('INSERT INTO video_clips (video_id, title_suggestion, hashtags, description, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)',
                        [videoId, aiContent.title_suggestion, aiContent.hashtags, aiContent.description, startTime, Math.min(endTime, duration)]
                    );
                }

                res.json({
                    message: 'Video processed successfully',
                    video: {
                        id: videoId,
                        title: videoTitle,
                        duration: duration,
                        status: 'completed'
                    },
                    clips: clips
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Processing failed', details: error.message });
    }
});

app.post('/api/shortener/upload-video', authenticateToken, upload.single('video'), async (req, res) => {
    try {
        const userId = req.user.userId;

        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        const file = req.file;
        const videoTitle = file.originalname.replace(/\.[^/.]+$/, ""); // Remove extension
        const duration = 120 + Math.floor(Math.random() * 300); // Mock duration 2-7 minutes

        // Create video record
        db.run('INSERT INTO videos (user_id, title, original_filename, file_path, duration, status) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, videoTitle, file.originalname, file.path, duration, 'completed'],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to save video' });
                }

                const videoId = this.lastID;

                // Generate mock clips
                const clips = [];
                const numClips = Math.floor(Math.random() * 3) + 2; // 2-4 clips

                for (let i = 0; i < numClips; i++) {
                    const startTime = Math.floor(Math.random() * (duration - 30));
                    const endTime = startTime + 15 + Math.floor(Math.random() * 15); // 15-30 second clips
                    const aiContent = generateMockAIContent(videoTitle);

                    clips.push({
                        start_time: startTime,
                        end_time: Math.min(endTime, duration),
                        ...aiContent
                    });

                    // Save clip to database
                    db.run('INSERT INTO video_clips (video_id, title_suggestion, hashtags, description, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)',
                        [videoId, aiContent.title_suggestion, aiContent.hashtags, aiContent.description, startTime, Math.min(endTime, duration)]
                    );
                }

                res.json({
                    message: 'Video uploaded and processed successfully',
                    video: {
                        id: videoId,
                        title: videoTitle,
                        duration: duration,
                        status: 'completed'
                    },
                    clips: clips
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Upload failed', details: error.message });
    }
});

// Get user's videos
app.get('/api/shortener/videos', authenticateToken, (req, res) => {
    const userId = req.user.userId;

    db.all('SELECT * FROM videos WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, videos) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch videos' });
        }

        res.json({ videos });
    });
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('*', (req, res) => {
    // Check if it's an API route
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // For all other routes, serve the index.html (SPA behavior)
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 500MB.' });
        }
    }
    res.status(500).json({ error: error.message });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;

