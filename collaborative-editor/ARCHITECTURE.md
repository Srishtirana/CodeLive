# Collaborative Code Editor - Architecture Documentation

## Overview

A modern, real-time collaborative code editor that combines the best features of VS Code and Google Docs, built with premium UI/UX and advanced collaboration features.

## Architecture

### Frontend (React + TypeScript)
```
frontend/
├── src/
│   ├── components/
│   │   ├── Auth/           # Authentication components (Login, Signup)
│   │   ├── Editor/         # Monaco Editor with Yjs integration
│   │   │   ├── CollaborativeEditor.tsx      # Basic collaborative editor
│   │   │   └── PremiumCollaborativeEditor.tsx # Premium version with animations
│   │   ├── Files/          # File management components
│   │   │   ├── FileExplorer.tsx             # Basic file explorer
│   │   │   └── PremiumFileExplorer.tsx      # Premium version with animations
│   │   ├── Terminal/       # Terminal components
│   │   │   ├── Terminal.tsx                # Basic terminal
│   │   │   └── PremiumTerminal.tsx          # Premium version with animations
│   │   ├── Users/          # User management components
│   │   │   └── ActiveUsersPanel.tsx        # Active users with presence
│   │   ├── Workspace/      # Workspace management
│   │   │   └── WorkspaceList.tsx            # Workspace list component
│   │   └── Layout/         # Layout components
│   │       └── PremiumLayout.tsx              # Premium layout with glassmorphism
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.tsx               # Authentication state
│   │   └── ThemeContext.tsx              # Theme management
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   │   └── api.ts                      # API client with axios
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts                     # All type definitions
│   ├── utils/              # Utility functions
│   └── styles/             # Styling
│       └── globals.css                  # Global styles with glassmorphism
```

### Backend (Node.js + Express + TypeScript)
```
backend/
├── src/
│   ├── models/             # MongoDB models
│   │   ├── User.ts                     # User model with authentication
│   │   ├── Workspace.ts                # Workspace model with members
│   │   └── File.ts                     # File model with Yjs integration
│   ├── routes/             # API routes
│   │   ├── auth.ts                     # Authentication endpoints
│   │   ├── workspace.ts                # Workspace management endpoints
│   │   ├── file.ts                     # File CRUD operations
│   │   └── execute.ts                  # Code execution endpoints
│   ├── middleware/         # Express middleware
│   │   └── auth.ts                     # JWT authentication
│   ├── services/           # Business logic
│   │   └── yjsService.ts              # Yjs WebSocket provider
│   ├── controllers/        # Route controllers
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript types
```

## Data Flow

### 1. Authentication Flow
```
User (Login/Signup) 
    ↓
AuthContext (JWT Token)
    ↓
API Requests (Bearer Token)
    ↓
Protected Resources
```

### 2. Real-time Collaboration Flow
```
Monaco Editor 
    ↓
Yjs Document (CRDT)
    ↓
WebSocket Provider
    ↓
Other Users (Sync)
    ↓
Database (Auto-save)
```

### 3. Workspace Isolation
```
Workspace A
├── Files: A1.js, A2.py, A3.html
├── Users: User1, User2
└── Yjs Docs: workspace-a-file1, workspace-a-file2

Workspace B  
├── Files: B1.js, B2.py
├── Users: User3, User4
└── Yjs Docs: workspace-b-file1, workspace-b-file2
```

### 4. Code Execution Flow
```
Run Button Click
    ↓
API Request (/api/execute)
    ↓
Backend Security Check
    ↓
Docker Container (Sandbox)
    ↓
Code Execution
    ↓
Output Capture
    ↓
Frontend Display
```

## Core Technologies

### Frontend Stack
- **React 18** - Component framework with hooks
- **TypeScript** - Type safety and better development experience
- **Monaco Editor** - Professional code editing with IntelliSense
- **Yjs** - CRDT for conflict-free collaboration
- **Framer Motion** - Smooth animations and transitions
- **Tailwind CSS** - Utility-first styling with custom glassmorphism
- **Axios** - HTTP client for API communication
- **Lucide React** - Beautiful icons

### Backend Stack
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **MongoDB + Mongoose** - NoSQL database with ODM
- **WebSocket** - Real-time bidirectional communication
- **JWT** - Authentication tokens
- **Docker** - Code execution sandboxing

### Real-time Collaboration (Yjs + CRDT)

**How CRDT Works:**
1. **Conflict-free Replicated Data Types** - Data structures that can be merged automatically
2. **Operational Transformation** - Each edit is transformed into a reversible operation
3. **Automatic Merging** - Operations are applied in order, resolving conflicts
4. **Consistency Guarantee** - All users see the same final state

**Yjs Integration:**
```javascript
// Document creation
const ydoc = new Y.Doc()
const ytext = ydoc.getText('monaco')

// WebSocket provider
const provider = new WebsocketProvider(
  'ws://localhost:5000/yjs',
  documentId,
  ydoc
)

// Monaco binding
const binding = new MonacoBinding(
  ytext,
  monacoModel,
  new Set([editor]),
  provider.awareness
)
```

### Workspace Isolation

**Data Separation:**
- Each workspace has separate MongoDB documents
- Unique Yjs document IDs per workspace
- User permissions enforced at API level
- WebSocket connections scoped to workspace

**Security Model:**
```javascript
// Workspace member roles
{
  owner: 'full_control',
  admin: 'manage_users_and_files', 
  editor: 'read_and_write_files',
  viewer: 'read_only'
}
```

### Code Execution Security

**Sandboxing Strategy:**
1. **Container Isolation** - Each execution in separate Docker container
2. **Resource Limits** - CPU, memory, and time constraints
3. **Network Isolation** - No internet access from containers
4. **File System** - Temporary files only, cleaned up after execution
5. **Language Support** - Specific runtimes for each language

**Supported Languages:**
- JavaScript (Node.js)
- Python 3
- Java
- C/C++
- Ruby
- Go
- PHP
- HTML/CSS (static)

## Premium UI Features

### Glassmorphism Design
```css
.glass {
  background: rgba(17, 24, 39, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(99, 102, 241, 0.2);
}
```

### Neon Accents
```css
.neon-glow {
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.5),
              0 0 40px rgba(99, 102, 241, 0.3),
              0 0 60px rgba(99, 102, 241, 0.1);
}
```

### Smooth Animations
- **Page Transitions** - Fade and slide animations between routes
- **File Switching** - Animated file tabs with smooth transitions
- **Terminal Animation** - Slide-up animation for terminal panel
- **Cursor Movement** - Smooth animated cursor tracking
- **Micro-interactions** - Button ripples, hover effects, loading states

### Real-time Presence UI
- **Live Cursors** - Colored cursors with user names
- **Selection Highlighting** - Visual indication of text being edited
- **User Avatars** - Animated user presence indicators
- **Typing Indicators** - "User is typing..." notifications
- **Activity Status** - Online/offline/away status indicators

## Performance Optimizations

### Frontend
- **Code Splitting** - Lazy loading of components
- **Virtual Scrolling** - For large file lists
- **Debounced Updates** - Auto-save with 1-second delay
- **WebSocket Reconnection** - Automatic reconnection handling
- **Memoization** - Expensive computations cached

### Backend
- **Database Indexing** - Optimized queries for workspaces and files
- **Connection Pooling** - Efficient database connections
- **WebSocket Scaling** - Horizontal scaling support
- **Caching Strategy** - Redis for session management

## Security Considerations

### Authentication
- **JWT Tokens** - Secure authentication with expiration
- **Password Hashing** - bcryptjs for secure password storage
- **Role-based Access** - Granular permissions per workspace
- **Input Validation** - All inputs sanitized and validated

### Code Execution
- **Container Sandboxing** - Isolated execution environments
- **Resource Limits** - Prevent resource abuse
- **Network Isolation** - No external network access
- **Temporary Files** - Auto-cleanup after execution
- **Command Restrictions** - Limited terminal commands allowed

### Data Protection
- **HTTPS Enforcement** - All communications encrypted
- **CORS Configuration** - Proper cross-origin settings
- **Input Sanitization** - XSS and injection prevention
- **Rate Limiting** - API abuse prevention

## Deployment Architecture

### Docker Compose Setup
```yaml
services:
  mongodb:     # Database layer
  backend:     # API server with WebSocket
  frontend:    # Nginx + React build
  code-executor: # Isolated execution environment
```

### Production Considerations
- **Load Balancing** - Multiple backend instances
- **Database Replication** - MongoDB replica sets
- **CDN Deployment** - Static assets via CDN
- **Monitoring** - Application performance monitoring
- **Logging** - Centralized log aggregation

## Development Workflow

### Local Development
```bash
# Backend
cd backend && npm run dev

# Frontend  
cd frontend && npm start

# Database
mongod

# Docker (optional)
cd docker && docker-compose up
```

### Environment Configuration
```env
# Backend
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/collaborative-editor
JWT_SECRET=your-secret-key

# Frontend
REACT_APP_API_URL=http://localhost:5000/api
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user info

### Workspaces
- `GET /api/workspaces` - List user workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id` - Get workspace details
- `POST /api/workspaces/:id/members` - Add workspace member

### Files
- `GET /api/files/workspace/:workspaceId` - List workspace files
- `POST /api/files/workspace/:workspaceId` - Create file
- `GET /api/files/:id` - Get file content
- `PUT /api/files/:id` - Update file
- `DELETE /api/files/:id` - Delete file

### Code Execution
- `POST /api/execute/code` - Execute code
- `POST /api/execute/terminal/command` - Run terminal command

### WebSocket
- `WS /yjs` - Yjs document synchronization
- `WS /socket.io` - Real-time events and notifications

This architecture provides a scalable, secure, and feature-rich collaborative code editing experience with premium UI/UX and robust real-time capabilities.
