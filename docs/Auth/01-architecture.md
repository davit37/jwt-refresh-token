# Architecture: Auth Module

The Auth module follows **Clean Architecture** principles to ensure separation of concerns, testability, and independence from frameworks.

## 🏗️ Layer Breakdown

### 1. Domain Layer (`src/domain/`)
**Responsibility:** Enterprise business rules and entities.
- **Dependencies:** None.
- **Components:**
  - `User` Entity
  - `RefreshToken` Entity
  - `Role` Enum

### 2. Application Layer (`src/application/`)
**Responsibility:** Application-specific business rules (Use Cases). orchestrates data flow between Domain and Infrastructure.
- **Dependencies:** Domain, Infrastructure Interfaces (Repositories).
- **Components:**
  - `RegisterUseCase`: Handles user creation logic.
  - `LoginUseCase`: Validates credentials, generates **Family ID**, issues tokens.
  - `RefreshTokenUseCase`: implements **Rotation** and **Reuse Detection** logic.
  - `AuthDto`: Zod Schemas for input validation.

### 3. Infrastructure Layer (`src/infrastructure/`)
**Responsibility:** External agents (Database, Security libs).
- **Dependencies:** Application Interfaces, Domain.
- **Components:**
  - `PrismaClient`: Database connection.
  - `UserRepository`: Implementation of DB access for Users.
  - `RefreshTokenRepository`: Implementation of DB access for Tokens.
  - `JwtService`: Adapter for `jsonwebtoken`.
  - `PasswordService`: Adapter for `bcryptjs`.

### 4. Interface Layer (`src/interfaces/`)
**Responsibility:** Entry points (HTTP).
- **Dependencies:** Application Layer.
- **Components:**
  - `AuthController`: Handles HTTP Requests/Responses, Cookies.
  - `AuthRoutes`: Express Router definition.
  - `AuthMiddleware`: Protects routes using Access Token.

## 🔄 Dependency Graph

```mermaid
graph TD
    subgraph "Interface Layer"
        C[AuthController]
        R[AuthRoutes]
        M[AuthMiddleware]
    end

    subgraph "Application Layer"
        UC1[RegisterUseCase]
        UC2[LoginUseCase]
        UC3[RefreshTokenUseCase]
        DTO[AuthDto]
    end

    subgraph "Domain Layer"
        E1[User Entity]
        E2[RefreshToken Entity]
    end

    subgraph "Infrastructure Layer"
        Rep1[UserRepository]
        Rep2[RefreshTokenRepository]
        S1[JwtService]
        S2[PasswordService]
        DB[(Prisma / SQLite)]
    end

    R --> C
    C --> UC1
    C --> UC2
    C --> UC3
    C --> DTO

    UC1 --> Rep1
    UC1 --> S2
    UC2 --> Rep1
    UC2 --> Rep2
    UC2 --> S1
    UC2 --> S2
    UC3 --> Rep2
    UC3 --> S1

    Rep1 --> DB
    Rep2 --> DB

    UC1 -.-> E1
    UC2 -.-> E1
    UC3 -.-> E2
```
