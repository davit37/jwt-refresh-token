# Auth Workflows

This document details the critical flows within the Auth module, specifically focusing on the Security mechanisms.

## 🔐 Login Flow

When a user logs in, we establish a **Token Family** to track the lineage of refresh tokens.

```mermaid
sequenceDiagram
    participant C as Client
    participant API as AuthController
    participant UC as LoginUseCase
    participant DB as Database

    C->>API: POST /auth/login (email, password)
    API->>UC: execute(credentials)
    UC->>DB: Find User & Verify Password
    DB-->>UC: User Valid
    
    Note right of UC: Generate Family ID (UUID)
    
    UC->>UC: Sign Access Token (15m)
    UC->>UC: Sign Refresh Token (7d)
    UC->>UC: Hash Refresh Token (SHA256)
    
    UC->>DB: Store Refresh Token (hashed, familyId)
    DB-->>UC: Stored
    
    UC-->>API: { accessToken, refreshToken }
    
    API-->>C: JSON: { accessToken }
    API-->>C: Cookie: refreshToken (HttpOnly)
```

## 🔄 Refresh Token Rotation (Success Case)

Used when Access Token expires. The client presents the valid Refresh Token cookie.

```mermaid
sequenceDiagram
    participant C as Client
    participant API as AuthController
    participant UC as RefreshTokenUseCase
    participant DB as Database

    C->>API: POST /auth/refresh (Cookie: refreshToken)
    API->>UC: execute(refreshToken)
    
    Note right of UC: 1. Verify Signature
    Note right of UC: 2. Share Hash
    
    UC->>DB: Find Token by Hash
    DB-->>UC: Token Record
    
    opt If Token Revoked
        UC->>UC: Throw Security Breach Error
    end
    
    Note right of UC: 3. Rotation Logic
    
    UC->>DB: Revoke OLD Token (id)
    
    Note right of UC: Keep SAME Family ID
    
    UC->>UC: Sign NEW Access Token
    UC->>UC: Sign NEW Refresh Token
    UC->>DB: Store NEW Token (hashed, same familyId)
    
    UC-->>API: { newAccess, newRefresh }
    API-->>C: JSON: { newAccessToken }
    API-->>C: Cookie: newRefreshToken (HttpOnly, Rotated)
```

## 🚨 Reuse Detection (Security Breach)

What happens if an attacker steals an old refresh token and tries to use it?

```mermaid
sequenceDiagram
    participant Attacker
    participant API
    participant UC
    participant DB

    Note over Attacker: Possesses OLD/REVOKED Refresh Token
    
    Attacker->>API: POST /auth/refresh
    API->>UC: execute(oldToken)
    
    UC->>DB: Find Token by Hash
    DB-->>UC: Token Record (revoked=true)
    
    Note right of UC: DETECTED REUSE!
    
    UC->>DB: **Revoke Family** (Update all where familyId=X set revoked=true)
    
    UC-->>API: Error: Reuse Detected
    API-->>Attacker: 403 Forbidden
    
    Note over Attacker: All tokens invalid. Access lost.
```
