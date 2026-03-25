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

1. Run the schema to create the database and tables:
\`\`\`bash
mysql -u root -p < database/schema.sql
\`\`\`

2. Seed demo data (categories, products, and user accounts):
\`\`\`bash
mysql -u root -p < database/seed_demo_data.sql
\`\`\`

### Backend Setup

1. Navigate to backend directory:
\`\`\`bash
cd backend
npm install
\`\`\`

2. Create \`.env\` file from the example and update your MySQL password:
\`\`\`bash
cp .env.example .env
\`\`\`

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

## Demo Accounts

- **Admin:** \`admin@nextlink.com\` / \`admin123\`
- **User:** \`user@nextlink.com\` / \`user123\`

## Project Structure

\`\`\`
merch-portal/
├── backend/          # Fastify API server
├── frontend/         # React application
├── database/         # SQL schema & seed data
└── README.md
\`\`\`

## License

MIT
