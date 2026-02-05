# Nextlink Merch Portal

A full-stack merchandise ordering system built with React, TypeScript, and Node.js.

## Features

- 🛍️ Product catalog with size selection
- 🛒 Shopping cart with live updates
- 👤 User authentication with JWT
- 🔄 Automatic token refresh
- 👨‍💼 Admin dashboard for product and order management
- 📦 Order tracking and status management
- 🎨 Dark theme UI matching Nextlink branding

## Tech Stack

**Frontend:**
- React 19
- TypeScript
- Vite
- React Router DOM 7

**Backend:**
- Node.js
- Fastify
- TypeScript
- MySQL
- JWT authentication

**Database:**
- MySQL 8.0+

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Database Setup

1. Create MySQL database:
\`\`\`sql
CREATE DATABASE inventory_db;
\`\`\`

2. Run the schema (located in \`database/schema.sql\`)

3. Update database credentials in \`backend/.env\`

### Backend Setup

1. Navigate to backend directory:
\`\`\`bash
cd backend
npm install
\`\`\`

2. Create \`.env\` file (see \`.env.example\`)

3. Start the server:
\`\`\`bash
npm run dev
\`\`\`

### Frontend Setup

1. Navigate to frontend directory:
\`\`\`bash
cd frontend
npm install
\`\`\`

2. Start the dev server:
\`\`\`bash
npm run dev
\`\`\`

3. Open http://localhost:5173

## Default Admin Account

- Email: \`admin@nextlink.com\`
- Password: \`admin123\`

## Project Structure

\`\`\`
merch-portal/
├── backend/          # Fastify API server
├── frontend/         # React application
├── database/         # SQL schema
└── README.md
\`\`\`

## License

MIT
