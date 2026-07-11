# AI Interviewer - Phase 1: Authentication Foundation

## Overview

This is the authentication foundation for the AI Interviewer portfolio project. It demonstrates production-quality code with proper architecture, security, and maintainability.

## Tech Stack

### Client
- **Next.js 14** with App Router
- **JavaScript** (not TypeScript)
- **Tailwind CSS** for styling

### Server
- **Express.js** for API
- **PostgreSQL** database
- **Prisma ORM** for database access
- **JWT** for authentication
- **bcryptjs** for password hashing

## Project Structure

```
ai-interviewer/
├── client/                  # Next.js frontend
│   ├── app/
│   │   ├── layout.jsx      # Root layout
│   │   ├── page.jsx        # Home page (redirects to login)
│   │   ├── globals.css     # Global styles
│   │   ├── login/
│   │   │   └── page.jsx    # Login page
│   │   ├── register/
│   │   │   └── page.jsx    # Registration page
│   │   └── dashboard/
│   │       └── page.jsx    # Dashboard (protected)
│   ├── next.config.js      # Next.js configuration
│   ├── tailwind.config.js  # Tailwind configuration
│   └── postcss.config.js   # PostCSS configuration
├── server/                  # Express.js backend
│   ├── src/
│   │   ├── index.js        # Server entry point
│   │   ├── config/
│   │   │   ├── database.js # Prisma client setup
│   │   │   ├── jwt.js      # JWT configuration
│   │   │   └── cors.js     # CORS configuration
│   │   ├── controllers/
│   │   │   └── authController.js  # Auth logic
│   │   ├── routes/
│   │   │   └── auth.js     # Auth routes
│   │   ├── middleware/
│   │   │   ├── authenticate.js    # JWT verification
│   │   │   ├── validate.js        # Input validation
│   │   │   └── errorHandler.js    # Error handling
│   │   ├── services/
│   │   └── utils/
│   │       ├── jwt.js      # JWT utilities
│   │       └── password.js # Password utilities
│   └── prisma/
│       └── schema.prisma   # Database schema
└── docs/                    # Documentation
```

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /api/auth/register | Register new user | No |
| POST | /api/auth/login | Login user | No |
| POST | /api/auth/logout | Logout user | No |
| GET | /api/auth/me | Get current user | Yes |

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install:all
   ```

3. Set up database:
   ```bash
   cd server
   npx prisma migrate dev
   ```

4. Configure environment variables:
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your database credentials
   ```

5. Start development servers:
   ```bash
   npm run dev
   ```

## Security Features

- Passwords hashed with bcryptjs (10 salt rounds)
- JWT stored in HttpOnly cookies (not localStorage)
- SameSite=Lax for CSRF protection
- Secure=true in production
- Input validation on all endpoints
- No sensitive data in JWT payload

## Request Flow

### Registration
1. Client sends username + password to POST /api/auth/register
2. Server validates input
3. Server checks if username exists (409 if duplicate)
4. Server hashes password
5. Server creates user in database
6. Server generates JWT with user id + role
7. Server sets HttpOnly cookie with JWT
8. Server returns user data (201)

### Login
1. Client sends username + password to POST /api/auth/login
2. Server validates input
3. Server finds user by username
4. Server compares password with bcrypt
5. Server generates JWT
6. Server sets HttpOnly cookie
7. Server returns user data (200)

### Protected Route
1. Client requests protected resource
2. Browser automatically sends cookie
3. Server middleware reads JWT from cookie
4. Server verifies JWT signature
5. Server finds user in database
6. Server attaches user to request
7. Route handler accesses req.user

## Why These Decisions?

### Why Prisma?
- Type-safe database queries
- Auto-generated client
- Easy migrations
- Great DX with schema-first approach

### Why HttpOnly Cookies?
- JavaScript cannot access the cookie (XSS protection)
- Browser handles sending the cookie automatically
- SameSite attribute provides CSRF protection
- More secure than localStorage for auth tokens

### Why JWT in Cookies?
- HttpOnly prevents XSS attacks
- SameSite=Lax prevents CSRF attacks
- No token in localStorage (vulnerable to XSS)
- Automatic expiration handled by JWT

### Why Separate Controllers/Routes/Middleware?
- Single Responsibility Principle
- Easy to test individual components
- Clear separation of concerns
- Scalable architecture for future features
