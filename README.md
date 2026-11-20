# JWT-OTP-Authentication
A reusable authentication starter template built with Node.js, Express.js, MongoDB, JWT, email OTP verification, refresh token rotation, and secure session management.


# Express JWT OTP Authentication

A reusable, open-source authentication starter template built with **Node.js, Express.js, MongoDB, and JWT**.

This project provides a basic authentication system with email OTP verification, access tokens, refresh tokens, cookie-based session management, and multi-device logout.

The goal is to help developers quickly integrate authentication into their Express.js applications.

## Features

- User Registration
- Email OTP Verification
- Secure Password Hashing
- User Login & Logout
- JWT Access Token Authentication
- Refresh Token Rotation
- HttpOnly Cookie-Based Refresh Tokens
- MongoDB Session Management
- Logout from Current Device
- Logout from All Devices
- Get Authenticated User Profile
- Nodemailer Email Integration
- Environment-Based Configuration
- RESTful API Structure

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- Nodemailer
- Cookie Parser
- dotenv

## Project Structure

```text
express-jwt-otp-auth/
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
├── README.md
├── LICENSE
│
└── src/
    ├── app.js
    │
    ├── config/
    │   └── config.js
    │
    ├── controllers/
    │   └── auth.controller.js
    │
    ├── models/
    │   ├── user.model.js
    │   ├── session.model.js
    │   └── otp.model.js
    │
    ├── routes/
    │   └── auth.routes.js
    │
    ├── services/
    │   └── email.services.js
    │
    └── utils/
        └── utils.js
```

## Prerequisites

Before installing this project, make sure you have:

- Node.js (LTS version recommended)
- npm
- MongoDB installed locally or a MongoDB Atlas account
- Gmail account with Google OAuth2 credentials
- Postman or another API testing tool

## Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/express-jwt-otp-auth.git
```

Navigate into the project:

```bash
cd express-jwt-otp-auth
```

### Step 2: Install Dependencies

Install all project dependencies:

```bash
npm install
```

If dependencies are not already configured, install them using:

```bash
npm install express mongoose jsonwebtoken nodemailer cookie-parser dotenv
```

Install development dependencies:

```bash
npm install -D nodemon
```

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory.

Copy the example configuration:

```bash
cp .env.example .env
```

For Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Add your configuration:

```env
PORT=3000
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/auth_db

JWT_SECRET=your_long_random_secret_key

GOOGLE_USER=your_email@gmail.com
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REFRESH_TOKEN=your_google_oauth_refresh_token
```

Replace the placeholder values with your actual credentials.

**Important:** Never upload your `.env` file or real credentials to GitHub.

### Step 4: Configure MongoDB

You can use either:

**Option 1: Local MongoDB**

Make sure MongoDB is running on your computer.

```env
MONGO_URI=mongodb://localhost:27017/auth_db
```

**Option 2: MongoDB Atlas**

Create a free MongoDB Atlas cluster:

https://www.mongodb.com/cloud/atlas

Get your MongoDB connection string and add it to `.env`.

```env
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/auth_db
```

Replace the username, password, and cluster information with your actual values.

### Step 5: Configure Gmail OAuth2

This project uses Nodemailer with Google OAuth2 for sending verification emails.

Follow these steps:

1. Open Google Cloud Console: https://console.cloud.google.com/
2. Create a Google Cloud project.
3. Enable the Gmail API.
4. Configure OAuth consent screen.
5. Create OAuth 2.0 credentials.
6. Generate an OAuth2 refresh token using an appropriate OAuth flow.
7. Add your credentials to the `.env` file.

Required environment variables:

```env
GOOGLE_USER=your_email@gmail.com
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
```

### Step 6: Start the Development Server

Run the application:

```bash
npm run dev
```

For production:

```bash
npm start
```

If everything is configured correctly, your server should start on:

```text
http://localhost:3000
```

## API Endpoints

Base URL:

```text
http://localhost:3000/api/auth
```

| Method | Endpoint | Description |
|---|---|---|
| POST | /register | Register a new user |
| POST | /verify-email | Verify email using OTP |
| POST | /login | Authenticate user |
| GET | /get-me | Get authenticated user |
| GET | /refresh-token | Refresh access token |
| POST | /logout | Logout current device |
| POST | /logout-all | Logout all devices |

## Authentication Flow

### 1. Register User

**POST** `/api/auth/register`

Request body:

```json
{
  "username": "John",
  "email": "john@example.com",
  "password": "password123"
}
```

Creates a new user and sends an email verification OTP.

### 2. Verify Email

**POST** `/api/auth/verify-email`

Request body:

```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

Verifies the OTP and activates the user's email verification status.

### 3. Login

**POST** `/api/auth/login`

Request body:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Authenticates the user, creates a session, sets an HttpOnly refresh token cookie, and returns an access token.

### 4. Get Current User

**GET** `/api/auth/get-me`

Header:

```text
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Returns the authenticated user's profile.

### 5. Refresh Access Token

**GET** `/api/auth/refresh-token`

The refresh token is automatically sent through the HttpOnly cookie.

Validates and rotates the refresh token and generates a new access token.

### 6. Logout Current Device

**POST** `/api/auth/logout`

Revokes the current session and clears the refresh token cookie.

### 7. Logout All Devices

**POST** `/api/auth/logout-all`

Revokes all active sessions belonging to the authenticated user.

## Security Notes

- Never expose JWT secrets or OAuth credentials.
- Keep `.env` out of version control.
- Use HTTPS in production.
- Configure secure cookie settings for production.
- Use appropriate CORS settings.
- Implement OTP expiration and rate limiting.
- Use a password hashing algorithm such as Argon2id or bcrypt for production.
- Store refresh tokens securely, preferably as hashes.
- Validate and sanitize incoming request data.
- Use secure session rotation and revocation logic.

**Important:** If using SHA-256 for password hashing in the starter code, replace it with a password-specific hashing algorithm such as Argon2id or bcrypt before production deployment.

## Contributing

Contributions are welcome!

1. Fork this repository.
2. Create a new feature branch.
3. Make your changes.
4. Commit your changes.
5. Submit a pull request.

## License

This project is licensed under the MIT License.

See the `LICENSE` file for more information.

## Author

Developed as an open-source authentication starter template.

If you find this project useful, consider giving the repository a ⭐ on GitHub!
