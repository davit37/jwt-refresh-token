# API Reference: Auth Module

## Base URL
`http://localhost:3000/auth`

---

## 1. Register
Create a new user account.

- **URL:** `/register`
- **Method:** `POST`
- **Auth:** None
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "strongPassword123",
    "role": "USER" // Optional, default "USER"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "id": "uuid...",
    "email": "user@example.com",
    "role": "USER",
    "createdAt": "..."
  }
  ```

---

## 2. Login
Authenticate and receive tokens.

- **URL:** `/login`
- **Method:** `POST`
- **Auth:** None
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "strongPassword123"
  }
  ```
- **Response:** `200 OK`
  - **Body:**
    ```json
    {
      "accessToken": "ey...",
      "user": { ... }
    }
    ```
  - **Cookies:**
    - `refreshToken`: HttpOnly, Secure (prod), SameSite=Strict.

---

## 3. Refresh Token
Rotate credentials to get a fresh Access Token.

- **URL:** `/refresh`
- **Method:** `POST`
- **Auth:** None (Cookie required)
- **Cookies:**
  - `refreshToken`: Valid JWT string.
- **Response:** `200 OK`
  - **Body:**
    ```json
    {
      "accessToken": "ey... (new)"
    }
    ```
  - **Cookies:**
    - `refreshToken`: **Rotated** (New value).

- **Errors:**
  - `401 Unauthorized`: Invalid/Missing token.
  - `403 Forbidden`: Reuse detected or Expired.

---

## 4. Get Profile (Verification)
Test access to protected route.

- **URL:** `/me`
- **Method:** `GET`
- **Auth:** `Bearer <accessToken>`
- **Response:** `200 OK`
  ```json
  {
    "user": {
      "userId": "uuid...",
      "role": "USER"
    }
  }
  ```

---

## 5. Logout
Clear local session.

- **URL:** `/logout`
- **Method:** `POST`
- **Response:** `200 OK` (Clears cookie)
