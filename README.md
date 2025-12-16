# Production-Ready JWT Authentication API

Describes a production-ready REST API boilerplate built with **Express.js**, **TypeScript**, and **Prisma**, featuring advanced security measures like **Refresh Token Rotation**, **Reuse Detection (Family Revocation)**, and **HttpOnly Cookies**.

## 🚀 Tech Stack

- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** Prisma (SQLite for dev)
- **Validation:** Zod
- **Auth:** JSON Web Token (JWT), bcryptjs
- **Security:** Helmet, CORS, Cookie-Parser, HttpOnly Cookies

## ✨ Features

- **Clean Architecture:** Separation of concerns (Domain, Application, Infrastructure, Interface).
- **Secure Authentication:**
  - **Access Tokens:** Short-lived (15 min).
  - **Refresh Tokens:** Long-lived (7 days), stored in HttpOnly cookies.
  - **Token Hashing:** Refresh tokens are hashed before storage.
- **Advanced Token Management:**
  - **Rotation:** New refresh token issued on every use.
  - **Reuse Detection:** Immediate family revocation if a used token is replayed (Anti-Theft).
- **Type Safety:** Full TypeScript support with Zod validation.

## 📂 Folder Structure

```
src/
├── config/                # Environment variables & configuration
├── domain/                # Business entities & Enums (Pure TS)
├── application/           # Use Cases & DTOs (Business Logic)
├── infrastructure/        # External services (Prisma, JWT, Bcrypt)
├── interfaces/            # HTTP Layer (Controllers, Routes, Middlewares)
└── server.ts              # Entry point
```

## 🛠️ Getting Started

### Prerequisites

- Node.js v20+
- pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd jwt-refresh-token
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   The project uses a local SQLite database for development. Ensure your `.env` file is populated (created automatically on setup or copied from example).
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_ACCESS_SECRET="your-secure-secret"
   JWT_REFRESH_SECRET="your-secure-refresh-secret"
   ```

4. **Initialize Database**
   ```bash
   npx prisma migrate dev --name init
   npx pnpm seed  # Seeds Admin & User accounts
   ```

5. **Start Server**
   ```bash
   pnpm dev
   ```
   Server runs on `http://localhost:3000`.

## 🧪 Testing

A **Postman Collection** is included in the root directory: `postman_collection.json`.

### Auth Flow
1. **Register** a new user or **Login** with seeded credentials:
   - Admin: `admin@example.com` / `password123`
2. **Access Token** is returned in the JSON body.
3. **Refresh Token** is set securely in an `HttpOnly` cookie.
4. Use the Access Token in the `Authorization: Bearer <token>` header for protected routes (`/auth/me`).
5. Call `/auth/refresh` to rotate tokens.

## 🛡️ Security Logic (Reuse Detection)

If a valid refresh token is used:
1. It is revoked.
2. A new pair (Access + Refresh) is issued.
3. The new Refresh Token belongs to the same **Family**.

If a **Revoked** token is used (Theft Attempt):
1. The system detects reuse.
2. **ALL** tokens in that Family are immediately revoked.
3. The user (and potential attacker) are forced to re-login.
