# Student Work Archive System

A web-based system for archiving, browsing, and showcasing student works (projects, reports, theses, presentations, etc.) stored on Google Shared Drive. Users can view, vote, and comment on submissions while administrators manage content organization and system configuration.

## Features

- **Google Drive Integration**: Centralized storage using Google Shared Drive
- **PDF Viewing**: Built-in PDF viewer using PDF.js
- **Search & Browse**: Full-text search with category, tag, and type filters
- **Voting System**: Star rating (0-5 stars) with one vote per user per work
- **Comments**: Threaded comments with replies
- **Favorites**: Personal bookmarking of works
- **Sharing**: Generate shareable public links
- **Admin Dashboard**: Analytics, user management, and content moderation
- **Export**: CSV and PDF report generation

## Technology Stack

### Frontend
- React + Vite
- Tailwind CSS with shadcn/ui components
- PDF.js for document viewing
- Recharts for analytics

### Backend
- Node.js + Express
- SQLite via better-sqlite3
- Passport.js + Google OAuth 2.0
- Nodemailer for notifications

## Prerequisites

- Node.js 18+
- Google Cloud Project with:
  - Drive API enabled
  - OAuth 2.0 credentials configured
- Access to a Google Shared Drive for file storage
- SMTP server credentials (optional, for email notifications)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd StudentWorkArchiveSystem
   ```

2. **Run the setup script**
   ```bash
   ./init.sh
   ```

3. **Configure environment variables**

   Edit the `.env` file with your credentials:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_SHARED_DRIVE_ID=your_drive_id
   SESSION_SECRET=your_secret_key
   ```

4. **Start the development servers**

   Terminal 1 (Backend):
   ```bash
   cd backend && npm run dev
   ```

   Terminal 2 (Frontend):
   ```bash
   cd frontend && npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## Project Structure

```
StudentWorkArchiveSystem/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── index.js        # Entry point
│   ├── data/               # SQLite database
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── context/        # React context
│   │   ├── utils/          # Utility functions
│   │   └── styles/         # CSS/Tailwind styles
│   ├── public/             # Static assets
│   └── package.json
├── .env                    # Environment variables
├── init.sh                 # Setup script
└── README.md
```

## User Roles

| Role  | Description |
|-------|-------------|
| Admin | Full system access: manage works, categories, tags, users, and configuration |
| User  | Browse works, vote, comment, add favorites, download |
| Guest | View public works (if enabled), read-only access |

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate OAuth flow
- `GET /auth/google/callback` - OAuth callback
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user

### Works
- `GET /api/works` - List works
- `GET /api/works/:id` - Get work details
- `POST /api/works/:id/vote` - Submit vote
- `GET /api/works/:id/comments` - Get comments
- `POST /api/works/:id/comments` - Add comment

### Admin
- `GET /admin/config` - Get configuration
- `PUT /admin/config` - Update configuration
- `POST /admin/works` - Create work
- `PUT /admin/works/:id` - Update work
- `DELETE /admin/works/:id` - Delete work

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Environment (development/production) |
| `PORT` | Backend server port |
| `DATABASE_PATH` | SQLite database file path |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_SHARED_DRIVE_ID` | Google Shared Drive ID |
| `SESSION_SECRET` | Express session secret |
| `SMTP_*` | Email server configuration |

## License

MIT License
