# Clipzaar - AI Video Clipping Tool

A modern AI-powered video clipping tool that transforms long videos into viral short clips with automatically generated titles, hashtags, and descriptions.

## Features

- 🎥 **YouTube Video Processing**: Paste any YouTube URL to create short clips
- 📁 **Direct Video Upload**: Upload video files directly (MP4, AVI, MOV, MKV, WMV, FLV, WEBM)
- 🤖 **AI Content Generation**: Automatic titles, hashtags, and descriptions
- 🔐 **User Authentication**: Secure registration and login system
- 📱 **Responsive Design**: Works perfectly on desktop and mobile
- ⚡ **Fast Processing**: Quick video analysis and clip generation

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Deployment**: Vercel

## Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd clipzaar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

### Option 2: Deploy via GitHub

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect the configuration

### Option 3: Deploy via Vercel Dashboard

1. **Zip your project files**
2. **Go to Vercel Dashboard**
3. **Click "New Project"**
4. **Upload your zip file**
5. **Deploy**

## Environment Variables

For production deployment, set these environment variables in Vercel:

- `JWT_SECRET`: A secure secret key for JWT token signing
- `NODE_ENV`: Set to "production"

## Project Structure

```
clipzaar/
├── public/                 # Static frontend files
│   ├── index.html         # Homepage
│   ├── shortener.html     # Video processing page
│   ├── login.html         # Login page
│   ├── register.html      # Registration page
│   ├── pricing.html       # Pricing page
│   ├── about.html         # About page
│   ├── styles.css         # Main styles
│   ├── home-enhanced.css  # Enhanced home styles
│   ├── auth.css          # Authentication styles
│   ├── shortener.js      # Video processing logic
│   └── home-enhanced.js  # Enhanced home functionality
├── server.js             # Node.js/Express server
├── package.json          # Dependencies and scripts
├── vercel.json           # Vercel configuration
└── README.md             # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Video Processing
- `POST /api/shortener/process-youtube` - Process YouTube video
- `POST /api/shortener/upload-video` - Upload and process video file
- `GET /api/shortener/videos` - Get user's processed videos

## Features Overview

### 🏠 Homepage
- Modern gradient design
- Video URL input with validation
- File upload with drag-and-drop
- Authentication state management
- Responsive mobile design

### 🎬 Video Shortener
- Dual input methods (URL/Upload)
- Real-time processing status
- AI-generated content preview
- Results display with copy functionality

### 🔐 Authentication
- Secure user registration
- JWT-based authentication
- Password validation
- Session persistence

### 💰 Pricing
- Three-tier pricing structure
- Interactive FAQ section
- Feature comparison

### 📞 About/Contact
- Company information
- Feature highlights
- Contact form

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@clipzaar.com or create an issue in the repository.

