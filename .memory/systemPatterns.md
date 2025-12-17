# System Patterns

## Architecture
The project follows **Clean Architecture** principles to ensure separation of concerns and testability.

### Layers
1.  **Domain**: Core business entities (`User`, `RefreshToken`) and enums. *No external dependencies.*
2.  **Application**: Business logic / Use Cases (`LoginUseCase`, `RefreshTokenUseCase`). Depends only on Domain and Repository Interfaces.
3.  **Infrastructure**: Implementation details (`PrismaUserRepository`, `JwtService`, `PasswordService`). External libraries live here.
4.  **Interface (Presentation)**: HTTP Controllers, Routes, and Middlewares (`AuthController`, `auth.routes`).

## Security Patterns

### JWT Strategy
- **Access Token**: Short-lived (e.g., 15m). Contains `userId`, `role`, and `tokenVersion`. Stateless verification, but includes a DB check for `tokenVersion`.
- **Refresh Token**: Long-lived (e.g., 7d). Stored in Database. Opaque to client (HttpOnly Cookie recommended, though implementation varies).

### Refresh Token Security
1.  **Rotation**: Every time a Refresh Token is used, it is revoked, and a new pair (Access + Refresh) is issued. The new Refresh Token belongs to the same "Family".
2.  **Family ID**: Links a chain of rotated tokens. Used to track lineage.
3.  **Reuse Detection**:
    - If a token marked as `revoked` is presented, it indicates theft.
    - **Action**: `revokeFamily(familyId)` is called, invalidating ALL tokens in that chain.
    - **Counter-measure**: `incrementTokenVersion(userId)` is called to immediately invalidate all Access Tokens.

### Immediate Revocation (Token Versioning)
To solve the "Stateless Access Token" problem (where revoked users can still act until token expiry):
- Users have a `tokenVersion` (Int) in DB.
- Access Tokens include this `tokenVersion` in the payload.
- **Middleware**: Fetches user from DB and compares `token.version` vs `db.version`.
- If mismatch: Token is rejected (401).

## Error Handling
- Use Cases throw standard Javascript `Error`.
- Controllers catch errors and return appropriate HTTP status codes (400, 401, 403).
