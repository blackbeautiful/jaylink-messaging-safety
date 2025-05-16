# JayLink Backend

Backend server for JayLink SMS and Voice Messaging Platform.

## Features

- Complete user authentication system (register, login, password reset)
- Admin authentication and dashboard
- User profile management
- Role-based access control
- SMS and voice messaging
- Contact and group management
- File uploads (audio, CSV)
- Balance and transaction management
- Analytics and reporting
- Message scheduling
- Admin dashboard

## Tech Stack

- Node.js (v16+)
- Express (v4.18+)
- MySQL (v8.0+)
- Sequelize ORM
- JWT Authentication
- bcrypt for password hashing
- Joi validation
- Winston logger
- Multer for file uploads

## Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/jaylink-backend.git
   cd jaylink-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory using the provided `.env.example` as a template.

4. Create the MySQL database:
   ```sql
   CREATE DATABASE jaylink_db;
   CREATE USER 'jaylink_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON jaylink_db.* TO 'jaylink_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

5. Run database migrations:
   ```bash
   npm run migrate
   ```

6. Seed the database with initial data:
   ```bash
   npm run seed
   ```

### Development

Start the development server:
```bash
npm run dev
```

The server will be running at http://localhost:3000.

### Production

For production deployment:
```bash
npm start
```

## Project Structure

```
backend/
├── .env                           # Environment variables
├── package.json                   # Project dependencies and scripts
├── src/
│   ├── app.js                     # Express app setup
│   ├── server.js                  # Entry point
│   ├── config/                    # Configuration files
│   ├── controllers/               # Request handlers
│   ├── middleware/                # Custom middleware
│   ├── models/                    # Database models
│   ├── routes/                    # API routes
│   ├── services/                  # Business logic
│   ├── utils/                     # Utility functions
│   └── validators/                # Request validators
├── uploads/                       # Directory for uploaded files
└── logs/                          # Application logs
```

## API Documentation

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout user

### Admin Authentication

- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/auth/me` - Get admin profile
- `POST /api/admin/auth/logout` - Admin logout

### User Management

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/password` - Change password
- `PUT /api/users/settings` - Update user settings

### Admin User Management

- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:id` - Get user details
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

## Default Admin Credentials

Admin access:
- Username: `admin`
- Email: `admin@jaylink.com`
- Password: `admin123`

*Note: Change this password immediately after first login in production.*

## Testing

Run tests:
```bash
npm test
```

## License

This project is licensed under the ISC License.