# Project Brief: Auth Module

## Overview
A robust Authentication Module implementing secure JWT-based authentication with advanced security features like Refresh Token Rotation, Reuse Detection, and Immediate Revocation.

## Core Features
1.  **User Registration**: Secure password hashing (bcrypt).
2.  **Login**: Issues short-lived Access Tokens (Stateless) and long-lived Refresh Tokens (Stateful).
3.  **Token Refreshing**:
    - **Rotation**: Refresh tokens are one-time use. A new token is issued upon use.
    - **Reuse Detection**: If a used refresh token is tried again, the entire token family is revoked to prevent account takeover.
4.  **Immediate Revocation (Token Versioning)**:
    - Access Tokens are validated against a version number in the database (`tokenVersion`).
    - Revoking a family increments the `tokenVersion`, instantly invalidating all existing Access Tokens for that user.
5.  **Role-Based Access**: Basic support for User roles.

## Goals
- Provide a secure, production-ready authentication foundation.
- Mitigate common attacks (Replay attacks, Stolen Refresh Tokens).
- Maintain clean separation of concerns using Clean Architecture.
