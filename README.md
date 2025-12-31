# Blog Application

A Node.js blog application with user authentication and blog management features.

## Environment Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or remote connection)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`:
   ```env
   # Database Configuration
   MONGODB_URI=mongodb://127.0.0.1:27017/blog
   
   # Server Configuration
   PORT=9000
   
   # JWT Configuration
   JWT_SECRET=your_secure_jwt_secret_here
   JWT_EXPIRES_IN=1h
   
   # Environment
   NODE_ENV=development
   ```

### Running the Application

```bash
# Development mode with nodemon
npm start

# Production mode
node index.js
```

The application will be available at `http://localhost:9000` (or the port specified in your `.env` file).

### Security Notes

- **Never commit your `.env` file to version control**
- Change the default `JWT_SECRET` to a strong, random string in production
- Use a secure MongoDB connection string with authentication in production
- Consider using environment-specific `.env` files (`.env.development`, `.env.production`)

## Features

- User authentication with JWT
- Blog creation and management
- User profiles with social media links
- File upload for images
- User following system
- Blog commenting and liking

## Project Structure

```
├── controller/          # Route controllers
├── middleware/          # Custom middleware
├── models/             # Database models
├── public/             # Static files
├── routes/             # Route definitions
├── service/            # Business logic services
├── views/              # EJS templates
├── .env                # Environment variables (not in git)
├── .env.example        # Environment variables template
└── index.js            # Application entry point
```