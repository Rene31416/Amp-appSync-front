# Frontend (React + Cognito + AppSync)

A simple full-stack demo UI that authenticates users with Amazon Cognito and lets them manage personal tasks stored in DynamoDB through an AWS AppSync GraphQL API.

This repository contains the **frontend** only. The backend (Cognito User Pool, AppSync API, DynamoDB) is provisioned separately using **AWS CDK (TypeScript)**.

---

## Purpose

This project exists to demonstrate:

- How a React app authenticates with **Amazon Cognito**
- How the app calls a **GraphQL API (AWS AppSync)** using a JWT access token
- How the backend enforces per-user data isolation (each user sees only their own tasks)
- A practical, minimal example suitable for interview discussion:
  - Auth flow (sign up, email verification, sign in)
  - GraphQL requests from frontend
  - Secure usage of tokens (no secrets in the browser)
  - CRUD operations against a serverless backend

---

## Architecture (High Level)

- **React (Vite + TypeScript)** frontend
- **Cognito User Pool** for authentication (email verification enabled)
- **AppSync GraphQL API** protected by Cognito
- **DynamoDB** for task persistence

Flow:

1. User signs up → Cognito sends email verification code
2. User confirms email → user can sign in
3. Frontend obtains a Cognito JWT token (ID token)
4. Frontend sends GraphQL requests to AppSync using `Authorization: <JWT>`
5. AppSync resolver reads `ctx.identity` and scopes data to the authenticated user

---

## Features

- Sign up (username + email + password)
- Email verification (confirmation code)
- Sign in (email + password)
- Authenticated task list (per-user)
- Create task
- Update task status (OPEN / DONE)
- Delete task
- Logout

---

## Local Setup

### 1) Prerequisites

- Node.js (LTS recommended)
- pnpm
- A deployed backend (AppSync + Cognito + DynamoDB)

### 2) Install

```bash
pnpm install
```

### 3) Configure environment

Create a `.env.local` file that points to your deployed backend. At minimum
these variables must be present:

```
VITE_REGION=
VITE_USER_POOL_ID=
VITE_USER_POOL_CLIENT_ID=
VITE_APPSYNC_URL=
```

### 4) Run the dev server

```bash
pnpm dev
```

The app runs on [http://localhost:5173](http://localhost:5173) by default.

### 5) Validate the build

Before shipping changes, it helps to run the quality gates locally:

```bash
pnpm lint    # static analysis
pnpm build   # type-check + production bundle
```

Both commands surface environment-variable issues early, so you can fix them
before deploying the frontend.
