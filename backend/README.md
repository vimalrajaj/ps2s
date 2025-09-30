# SiH University Management - Backend

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Copy environment configuration:
```bash
# .env file already created with development settings
```

3. Start development server:
```bash
# From backend directory
npx tsx watch src/server.ts
```

## Available Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout  
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/change-password` - Change password

### Departments (Admin)
- `GET /api/departments` - List departments (with pagination)
- `POST /api/departments` - Create department (admin only)
- `GET /api/departments/:id` - Get department by ID
- `PUT /api/departments/:id` - Update department (admin only)
- `DELETE /api/departments/:id` - Delete department (admin only)
- `GET /api/departments/stats` - Department statistics

### Health
- `GET /api/health` - Health check
- `GET /healthz` - Simple health check

## Architecture

- **TypeScript + Express** - API framework
- **Supabase** - Database and auth backend
- **JWT + bcrypt** - Authentication and password hashing
- **Zod** - Request validation
- **Pino** - Structured logging

## Development

```bash
# Lint code
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## Testing

You can test the login endpoint with:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Admin credentials (from seeded data):
- Username: `admin`
- Password: `admin123`