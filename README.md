# Education Journey Launchpad

A comprehensive education platform with separate frontend and backend architecture.

## Project Structure

```
education-journey-launchpad/
├── client/                  # React Frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and configurations
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Helper functions
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
│
├── server/                  # Express Backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Backend utilities
│   └── package.json        # Backend dependencies
│
├── shared/                  # Shared code
│   ├── src/
│   │   ├── types/          # Common type definitions
│   │   └── utils/          # Shared utility functions
│   └── package.json        # Shared dependencies
│
├── config/                  # Project-wide configuration
│   └── firebase.config.ts  # Firebase configuration
│
└── package.json            # Root workspace configuration
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies for all packages:
   ```bash
   npm run install:all
   ```

### Development

Start both frontend and backend in development mode:
```bash
npm run dev
```

Or start them individually:
```bash
# Start frontend only
npm run client:dev

# Start backend only
npm run server:dev
```

### Available Scripts

- `npm run dev` - Start both client and server in development mode
- `npm run build` - Build both client and server
- `npm run lint` - Run linting for both client and server
- `npm run install:all` - Install dependencies for all packages

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Radix UI components
- React Router for navigation
- React Query for state management
- Firebase client SDK

### Backend
- Node.js with Express
- TypeScript
- Firebase Admin SDK
- Security middleware (Helmet, CORS)
- Request logging (Morgan)

## 🐳 Docker Support

Simple Docker setup for easy development.

### Quick Start with Docker

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop services
docker-compose down
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## Environment Variables

Create a `.env` file in the server directory based on `.env.example`
