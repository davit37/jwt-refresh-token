# Security Strategies

This module implements **Banking-Grade** security practices for token management.

## 🛡️ Critical Components

### 1. Family ID Tracking
Every time a user logs in, a new `familyId` (UUID) is generated. This ID is embedded in the Refresh Token's payload and stored in the database.
- **Purpose:** Links a chain of rotated tokens together.
- **Benefit:** Allows us to invalidate an **entire session** (all descendants) if any single token in the chain is compromised.

### 2. Token Rotation
Refresh tokens are **Usage-One-Time**.
- Upon use, the old token is marked `revoked = true`.
- A new token is issued.
- **Benefit:** If a token is stolen, the window of opportunity is limited to the time until the legitimate user (or attacker) uses it. Whoever comes second triggers the alarm.

### 3. Reuse Detection (Theft Protection)
If the API receives a Refresh Token that is already marked `revoked = true`:
1. We identify the `familyId` of that token.
2. We query **ALL** tokens with that `familyId`.
3. We mark them **ALL** as `revoked = true`.
4. The legitimate user is forced to log out (login again), thus shaking off the attacker.

### 4. HttpOnly Cookies
Refresh tokens are **never** sent in the JSON body. They are sent as `HttpOnly` cookies.
- **Benefit:** JavaScript (XSS attacks) cannot read the refresh token.

### 5. Token Hashing
We do **not** store raw refresh tokens in the database.
- **Method:** SHA256 Hash.
- **Benefit:** If the database is leaked, attackers cannot use the stored hashes to impersonate users, as they cannot reverse the hash to sign a valid JWT cookie.
