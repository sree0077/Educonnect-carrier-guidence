![Screenshot from 2025-05-27 11-03-22](https://github.com/user-attachments/assets/f35c5b0c-dcfe-4202-9514-031acd4eea06)# 🎓 Education Journey Launchpad

<div align="center">

![Education Journey Launchpad](https://img.shields.io/badge/Education-Journey%20Launchpad-blue?style=for-the-badge&logo=graduation-cap)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js)
![Firebase](https://img.shields.io/badge/Firebase-11.7.3-FFCA28?style=for-the-badge&logo=firebase)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

**A comprehensive platform connecting students with colleges through intelligent career guidance and aptitude testing**

[🚀 Live Demo](#) • [📖 Documentation](#-installation) • [🐛 Report Bug](https://github.com/sree0077/Educonnect-carrier-guidence/issues) • [✨ Request Feature](https://github.com/sree0077/Educonnect-carrier-guidence/issues)

</div>

---

## 📋 Table of Contents

- [🎯 About The Project](#-about-the-project)
- [✨ Features](#-features)
- [🛠️ Built With](#️-built-with)
- [🚀 Getting Started](#-getting-started)
- [📱 Screenshots](#-screenshots)
- [🔧 Installation](#-installation)
- [🐳 Docker Setup](#-docker-setup)
- [📖 Usage](#-usage)
- [🗂️ Project Structure](#️-project-structure)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [📞 Contact](#-contact)

---

## 🎯 About The Project

**Education Journey Launchpad** is a modern, full-stack web application designed to bridge the gap between students and educational institutions. The platform provides intelligent career guidance, comprehensive aptitude testing, and seamless college application management.

### 🌟 Why This Project?

- **For Students**: Discover the right career path through personalized aptitude tests and connect with colleges that match your profile
- **For Colleges**: Streamline the admission process with automated aptitude testing and efficient application management
- **For Everyone**: A user-friendly platform that makes educational decisions easier and more informed

### 🎯 Key Objectives

- 🎓 **Career Guidance**: Help students discover their strengths and suitable career paths
- 🏫 **College Matching**: Connect students with colleges that fit their profile and aspirations
- 📊 **Aptitude Testing**: Comprehensive testing system with instant results and detailed analytics
- 📝 **Application Management**: Streamlined application process for both students and colleges

---

## ✨ Features

### 👨‍🎓 For Students
- 📝 **Profile Management**: Create and manage comprehensive student profiles
- 🎯 **Aptitude Tests**: Take personalized aptitude tests to discover career paths
- 🏫 **College Discovery**: Browse and filter colleges based on preferences
- 📋 **Application Tracking**: Apply to colleges and track application status
- 📊 **Results Dashboard**: View test results with detailed analytics
- 🔔 **Real-time Notifications**: Get updates on application status

### 🏛️ For Colleges
- 🏢 **Institution Profiles**: Create detailed college profiles with courses
- 📝 **Question Management**: Create and manage aptitude test questions
- 📊 **Bulk Upload**: Upload questions in bulk via JSON format
- 👥 **Application Management**: Review and manage student applications
- 📈 **Analytics Dashboard**: Track application statistics and trends
- ⚡ **Automated Testing**: Automatic test evaluation and result generation

### 🔧 Technical Features
- 🔐 **Secure Authentication**: Firebase-based authentication system
- 📱 **Responsive Design**: Mobile-first, responsive UI design
- ⚡ **Real-time Updates**: Live data synchronization
- 🐳 **Docker Support**: Easy deployment with Docker containers
- 🔄 **Hot Reload**: Development-friendly hot reload
- 📊 **Data Analytics**: Comprehensive reporting and analytics

---

## 🛠️ Built With

### Frontend Technologies
- **[React 18](https://reactjs.org/)** - Modern UI library with hooks
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Vite](https://vitejs.dev/)** - Lightning-fast build tool
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[React Router](https://reactrouter.com/)** - Client-side routing
- **[React Query](https://tanstack.com/query)** - Data fetching and caching
- **[React Hook Form](https://react-hook-form.com/)** - Performant forms

### Backend Technologies
- **[Node.js](https://nodejs.org/)** - JavaScript runtime
- **[Express.js](https://expressjs.com/)** - Web application framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe backend development
- **[Firebase Admin](https://firebase.google.com/docs/admin/setup)** - Backend Firebase integration
- **[Helmet](https://helmetjs.github.io/)** - Security middleware
- **[Morgan](https://github.com/expressjs/morgan)** - HTTP request logger
- **[CORS](https://github.com/expressjs/cors)** - Cross-origin resource sharing

### Database & Authentication
- **[Firebase Firestore](https://firebase.google.com/docs/firestore)** - NoSQL document database
- **[Firebase Auth](https://firebase.google.com/docs/auth)** - Authentication service
- **[Firebase Storage](https://firebase.google.com/docs/storage)** - File storage service

### DevOps & Tools
- **[Docker](https://www.docker.com/)** - Containerization platform
- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Git](https://git-scm.com/)** - Version control

---

## 🚀 Getting Started

### 📋 Prerequisites

Before you begin, ensure you have the following installed on your local machine:

- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (v8.0.0 or higher) or **yarn** (v1.22.0 or higher)
- **Git** - [Download here](https://git-scm.com/)
- **Docker** (optional) - [Download here](https://www.docker.com/)

### 🔧 Installation

#### Option 1: Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/sree0077/Educonnect-carrier-guidence.git
   cd Educonnect-carrier-guidence
   ```

2. **Install dependencies for all packages**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp server/.env.example server/.env

   # Edit the .env file with your Firebase configuration
   nano server/.env
   ```

4. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev

   # Or start them individually
   npm run client:dev  # Frontend only
   npm run server:dev  # Backend only
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/api/health

#### Option 2: Quick Clone Commands

```bash
# HTTPS
git clone https://github.com/sree0077/Educonnect-carrier-guidence.git

# SSH
git clone git@github.com:sree0077/Educonnect-carrier-guidence.git

# GitHub CLI
gh repo clone sree0077/Educonnect-carrier-guidence
```

---

## 🐳 Docker Setup

For a quick and isolated development environment, use Docker:

### 🚀 Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/sree0077/Educonnect-carrier-guidence.git
cd Educonnect-carrier-guidence

# Start all services with Docker
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 🐳 Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start services in background
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild containers
docker-compose build --no-cache

# Check container status
docker-compose ps
```

### 🌐 Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

---

## 📖 Usage

### 👨‍🎓 For Students

1. **Sign Up**: Create a student account with your email
2. **Complete Profile**: Fill in your academic and personal details
3. **Browse Colleges**: Explore available colleges and courses
4. **Take Aptitude Tests**: Complete tests to discover your strengths
5. **Apply to Colleges**: Submit applications to your preferred institutions
6. **Track Progress**: Monitor your application status and test results

### 🏛️ For Colleges

1. **Register Institution**: Create a college account
2. **Set Up Profile**: Add college details, courses, and requirements
3. **Create Tests**: Design aptitude tests for your courses
4. **Manage Questions**: Add, edit, or bulk upload test questions
5. **Review Applications**: Evaluate student applications
6. **Track Analytics**: Monitor application trends and statistics

### 🔧 Available Scripts

```bash
# Development
npm run dev              # Start both client and server
npm run client:dev       # Start frontend only
npm run server:dev       # Start backend only

# Building
npm run build           # Build both client and server
npm run client:build    # Build frontend only
npm run server:build    # Build backend only

# Code Quality
npm run lint            # Lint both client and server
npm run client:lint     # Lint frontend only
npm run server:lint     # Lint backend only

# Installation
npm run install:all     # Install all dependencies
```

---

## 📱 Screenshots

### 🏠 Landing Page
*Modern and intuitive landing page with clear navigation*
![Screenshot from 2025-05-27 11-02-06](https://github.com/user-attachments/assets/42762b41-5e2b-435a-baa0-6ca9801055e5)
![Screenshot from 2025-05-27 11-03-22](https://github.com/user-attachments/assets/ac027056-aab9-494e-b8d9-d26eee6973f4)
![Screenshot from 2025-05-27 11-03-38](https://github.com/user-attachments/assets/43ec5fe2-d3b6-4cc3-9aaf-69ae26a5d288)

### 👨‍🎓 Student Dashboard
*Comprehensive dashboard showing applications, tests, and progress*
![Screenshot from 2025-05-27 11-04-44](https://github.com/user-attachments/assets/068c1c65-672f-422f-92fc-b30ba2695d7e)
![Screenshot from 2025-05-27 11-05-16](https://github.com/user-attachments/assets/814a3e01-11e8-400f-8e77-aee6f7c66598)
![Screenshot from 2025-05-27 11-05-47](https://github.com/user-attachments/assets/8fd670ae-77db-4846-8f46-40540ac3bfd2)



### 🏛️ College Dashboard
*Institution management interface with analytics and application tracking*
![Screenshot from 2025-05-27 11-06-01](https://github.com/user-attachments/assets/f683e167-818d-43d4-af09-a191dc58044f)
![Screenshot from 2025-05-27 11-11-41](https://github.com/user-attachments/assets/5e4e5ddf-93f1-466a-b03d-8a19929d3b63)
![Screenshot from 2025-05-27 11-12-07](https://github.com/user-attachments/assets/859adfd7-7190-4184-9cc2-9083e8e23a08)



### 📊 Aptitude Test Interface
*Clean and focused test-taking experience*

![Screenshot from 2025-05-27 11-12-21](https://github.com/user-attachments/assets/69ef6efd-72e6-4a75-8d60-71e04000e89f)
![Screenshot from 2025-05-27 11-12-37](https://github.com/user-attachments/assets/7017dcab-6181-4b24-be6f-90bb261e8f48)
![Screenshot from 2025-05-27 11-12-51](https://github.com/user-attachments/assets/cc3dbccd-fa0a-4c6b-8789-76de61fbcac5)
![Screenshot from 2025-05-27 11-53-01](https://github.com/user-attachments/assets/7f08570c-cf27-4914-8f09-8827209497b8)


### 📈 Results & Analytics
*Detailed results with visual analytics and insights*

![Screenshot from 2025-05-27 11-05-29](https://github.com/user-attachments/assets/c9a3cfe0-0845-4777-a56d-72c8a46491bd)



---

## 🗂️ Project Structure

```
education-journey-launchpad/
├── 📁 client/                    # React Frontend Application
│   ├── 📁 public/               # Static assets
│   │   ├── 🖼️ logo.svg          # Application logo
│   │   ├── 🖼️ colleges.svg      # College icons
│   │   └── 📄 sample-questions.json
│   ├── 📁 src/
│   │   ├── 📁 components/       # Reusable React components
│   │   │   ├── 📁 ui/           # Base UI components (buttons, inputs, etc.)
│   │   │   ├── 📁 student/      # Student-specific components
│   │   │   └── 📁 college/      # College-specific components
│   │   ├── 📁 pages/            # Page components
│   │   │   ├── 🏠 Index.tsx     # Landing page
│   │   │   ├── 👨‍🎓 College.tsx   # College dashboard
│   │   │   ├── 📝 Test.tsx      # Aptitude test interface
│   │   │   └── 📊 TestResults.tsx # Results display
│   │   ├── 📁 hooks/            # Custom React hooks
│   │   ├── 📁 lib/              # Utility libraries
│   │   ├── 📁 types/            # TypeScript type definitions
│   │   ├── 📁 utils/            # Helper functions
│   │   └── 📁 config/           # Configuration files
│   ├── 📄 package.json          # Frontend dependencies
│   ├── ⚙️ vite.config.ts        # Vite configuration
│   └── 🎨 tailwind.config.ts    # Tailwind CSS configuration
│
├── 📁 server/                    # Express Backend Application
│   ├── 📁 src/
│   │   ├── 📁 controllers/      # Route controllers
│   │   │   ├── 👤 AuthController.ts
│   │   │   ├── 🏛️ CollegeController.ts
│   │   │   ├── 👨‍🎓 StudentController.ts
│   │   │   ├── ❓ QuestionController.ts
│   │   │   └── 📝 TestController.ts
│   │   ├── 📁 routes/           # API route definitions
│   │   ├── 📁 services/         # Business logic services
│   │   ├── 📁 middleware/       # Express middleware
│   │   └── 🚀 index.ts          # Server entry point
│   ├── 📄 package.json          # Backend dependencies
│   ├── ⚙️ tsconfig.json         # TypeScript configuration
│   ├── 🔐 .env.example          # Environment variables template
│   └── 🔐 .env                  # Environment variables (not in repo)
│
├── 📁 shared/                    # Shared code between client and server
│   ├── 📁 src/
│   │   ├── 📁 types/            # Common type definitions
│   │   └── 📁 utils/            # Shared utility functions
│   └── 📄 package.json          # Shared dependencies
│
├── 📁 config/                    # Project-wide configuration
│   └── 🔥 firebase.config.ts    # Firebase configuration
│
├── 🐳 docker-compose.yml        # Docker container orchestration
├── 📄 package.json              # Root workspace configuration
├── 📖 README.md                 # Project documentation
└── 📄 .gitignore               # Git ignore rules
```

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### 🚀 Getting Started

1. **Fork the repository**
   ```bash
   gh repo fork sree0077/Educonnect-carrier-guidence
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Educonnect-carrier-guidence.git
   cd Educonnect-carrier-guidence
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **Make your changes**
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

5. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```

6. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Provide a clear description of your changes

### 📋 Contribution Guidelines

- **Code Style**: Follow the existing TypeScript and React patterns
- **Testing**: Add tests for new features and bug fixes
- **Documentation**: Update README and code comments
- **Commits**: Use clear, descriptive commit messages
- **Issues**: Check existing issues before creating new ones

### 🐛 Reporting Bugs

1. Check if the bug has already been reported
2. Create a new issue with:
   - Clear bug description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Environment details

### 💡 Suggesting Features

1. Check if the feature has been suggested
2. Create a new issue with:
   - Clear feature description
   - Use case and benefits
   - Possible implementation approach

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Education Journey Launchpad

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 📞 Contact

### 👨‍💻 Developer

**Sree** - [@sree0077](https://github.com/sree0077)

### 🔗 Project Links

- **Repository**: [https://github.com/sree0077/Educonnect-carrier-guidence](https://github.com/sree0077/Educonnect-carrier-guidence)
- **Issues**: [https://github.com/sree0077/Educonnect-carrier-guidence/issues](https://github.com/sree0077/Educonnect-carrier-guidence/issues)
- **Discussions**: [https://github.com/sree0077/Educonnect-carrier-guidence/discussions](https://github.com/sree0077/Educonnect-carrier-guidence/discussions)

### 💬 Get in Touch

- 📧 **Email**: [Create an issue](https://github.com/sree0077/Educonnect-carrier-guidence/issues) for project-related questions
- 💼 **LinkedIn**: Connect for professional inquiries
- 🐦 **Twitter**: Follow for project updates

---

<div align="center">

### 🌟 Show Your Support

If this project helped you, please consider giving it a ⭐ on GitHub!

**Made with ❤️ by [Sree](https://github.com/sree0077)**

---

*Education Journey Launchpad - Connecting Dreams with Opportunities* 🎓✨

</div>
