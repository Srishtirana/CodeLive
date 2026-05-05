# Collaborative Code Editor

A real-time collaborative code editor web application similar to a simplified VS Code + Google Docs hybrid, built with React, Monaco Editor, Yjs, and Node.js.

## Features

### Core Features
- **Real-time collaborative editing** with conflict-free syncing using CRDT (Yjs)
- **Live cursor and selection tracking** showing what other users are editing
- **Multiple workspaces** with isolated files and users
- **File system management** (create, edit, delete files)
- **Code execution** with secure sandboxed environment
- **Terminal interface** for command execution
- **User authentication** with signup/login
- **Auto-save** and session restoration

### Technical Features
- **Monaco Editor** for professional code editing experience
- **Yjs + WebSocket** for real-time collaboration
- **MongoDB** for data persistence
- **Docker containers** for code execution
- **TypeScript** for type safety
- **Responsive design** with Tailwind CSS

## Architecture

### Frontend (React + TypeScript)
```
frontend/
├── src/
│   ├── components/
│   │   ├── Auth/           # Authentication components
│   │   ├── Editor/         # Monaco Editor with Yjs integration
│   │   ├── Files/          # File explorer and management
│   │   ├── Terminal/       # Terminal UI component
│   │   └── Workspace/      # Workspace management
│   ├── contexts/            # React contexts (Auth, etc.)
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
```

### Backend (Node.js + Express + TypeScript)
```
backend/
├── src/
│   ├── models/             # MongoDB models (User, Workspace, File)
│   ├── routes/             # API routes (auth, workspace, file, execute)
│   ├── middleware/         # Express middleware (auth, etc.)
│   ├── controllers/        # Route controllers
│   ├── services/           # Business logic (Yjs WebSocket)
│   └── utils/              # Utility functions
```

### Real-time Collaboration (Yjs + WebSocket)
The collaboration system uses Yjs CRDT (Conflict-free Replicated Data Type) for:

1. **Document Synchronization**: All edits are automatically synced between users
2. **Cursor Tracking**: Real-time cursor positions and selections
3. **Conflict Resolution**: No conflicts even with simultaneous edits
4. **Offline Support**: Changes are queued and synced when reconnected

### Workspace Isolation
Each workspace is completely isolated:
- Separate file systems
- Isolated user permissions
- Unique Yjs document IDs
- Separate collaboration sessions

## Data Flow

### Authentication Flow
1. User signs up/logs in → JWT token issued
2. Token stored in localStorage → Auto-attached to API requests
3. Protected routes validate token → User context available

### Real-time Editing Flow
1. User opens file → Yjs document created/loaded
2. Monaco Editor binds to Yjs text → Edits sync via WebSocket
3. Changes broadcast to all users → Cursors/selections updated
4. Auto-save to database → Content persisted

### Code Execution Flow
1. User clicks "Run" → Code sent to backend
2. Backend creates temp file → Executes in sandbox
3. Output captured → Returned to frontend
4. Temp files cleaned up → Security maintained

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6.0+
- Docker (optional, for containerized execution)

### Local Development

1. **Clone and setup**
```bash
git clone <repository-url>
cd collaborative-editor
```

2. **Install dependencies**
```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration

# Frontend  
cd ../frontend
npm install
```

3. **Start MongoDB**
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:6.0

# Or install locally
mongod
```

4. **Start development servers**
```bash
# Backend (terminal 1)
cd backend
npm run dev

# Frontend (terminal 2)  
cd frontend
npm start
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Docker Deployment

1. **Using Docker Compose (Recommended)**
```bash
cd docker
docker-compose up -d
```

This will start:
- MongoDB database
- Backend API server
- Frontend web server
- Code execution sandbox

2. **Manual Docker Build**
```bash
# Backend
cd backend
docker build -f ../docker/Dockerfile.backend -t collaborative-editor-backend .

# Frontend
cd frontend  
docker build -f ../docker/Dockerfile.frontend -t collaborative-editor-frontend .
```

## Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/collaborative-editor
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Supported Languages for Code Execution
- JavaScript (Node.js)
- Python 3
- Java
- C/C++
- Ruby
- Go
- PHP
- HTML/CSS (static files)

## API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Workspaces
- `GET /api/workspaces` - List user workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id` - Get workspace details
- `POST /api/workspaces/:id/members` - Add member

### Files
- `GET /api/files/workspace/:workspaceId` - List workspace files
- `POST /api/files/workspace/:workspaceId` - Create file
- `GET /api/files/:id` - Get file content
- `PUT /api/files/:id` - Update file
- `DELETE /api/files/:id` - Delete file

### Code Execution
- `POST /api/execute/code` - Execute code
- `POST /api/execute/terminal/command` - Run terminal command

## Security Considerations

### Code Execution Security
- **Sandboxed Environment**: Code runs in isolated Docker containers
- **Resource Limits**: Memory and CPU restrictions enforced
- **Network Isolation**: No internet access from execution containers
- **File System**: Only temporary files accessible
- **Command Restrictions**: Limited terminal commands allowed

### Authentication & Authorization
- **JWT Tokens**: Secure authentication with expiration
- **Role-based Access**: Owner, admin, editor, viewer roles
- **Workspace Isolation**: Users can only access authorized workspaces
- **Input Validation**: All inputs sanitized and validated

## Performance Optimization

### Frontend Optimizations
- **Code Splitting**: Lazy loading of components
- **Virtual Scrolling**: For large file lists
- **Debounced Updates**: Auto-save with 1-second delay
- **WebSocket Reconnection**: Automatic reconnection handling

### Backend Optimizations
- **Database Indexing**: Optimized queries for workspaces and files
- **Connection Pooling**: Efficient database connections
- **WebSocket Scaling**: Horizontal scaling support
- **Caching**: Redis for session management (optional)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Ensure MongoDB is running on port 27017
- Check connection string in .env file
- Verify MongoDB credentials

**WebSocket Connection Issues**
- Check if backend WebSocket server is running
- Verify firewall settings
- Check browser console for errors

**Code Execution Not Working**
- Ensure Docker is installed and running
- Check if required language runtimes are available
- Verify temp directory permissions

**Frontend Build Errors**
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify all dependencies installed

### Development Tips

1. **Hot Reloading**: Both frontend and backend support hot reload during development
2. **Debugging**: Use browser dev tools for frontend, VS Code debugger for backend
3. **Testing**: Run tests with `npm test` in respective directories
4. **Logs**: Check console logs for debugging real-time issues

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **Monaco Editor** - Microsoft's code editor that powers VS Code
- **Yjs** - CRDT library for real-time collaboration
- **Socket.io** - Real-time bidirectional event-based communication
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
