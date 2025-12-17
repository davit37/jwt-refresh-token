# Tech Context

## Technology Stack
- **Language**: TypeScript
- **Runtime**: Node.js
- **Web Framework**: Express.js
- **Database**: SQLite (Development) / Prisma ORM
- **Testing**: Jest, Supertest

## Development Environment
- **Package Manager**: pnpm
- **Build**: `tsc` (Output to `dist/`)
- **Linting**: (Implied, partial)

## Key Libraries
- `jsonwebtoken`: JWT generation and verification.
- `bcryptjs`: Password hashing.
- `uuid`: Generating unique IDs for families and entities.
- `zod`: Input validation (DTOs).

## Project Structure
```
src/
├── application/       # Use Cases
├── domain/           # Entities
├── infrastructure/   # DB, Security, external services
└── interfaces/       # HTTP layer (Controllers, Routes)
```
