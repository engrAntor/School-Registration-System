# AI Usage

This document details which AI tools were used, in which parts, where AI made mistakes, and how they were corrected.

## AI Tools Used

| Tool | Version | Usage |
|------|---------|-------|
| Google Antigravity (AGY) | Claude Opus 4.6 | Project scaffolding, component creation, API client, page implementation |

## Where AI Was Used

### 1. Project Scaffolding
- **What**: Created the Next.js project structure with TypeScript, Tailwind CSS, and shadcn/ui components
- **AI Role**: Generated the `create-next-app` command and configuration files
- **Human Review**: Verified the generated config matches the spec requirements

### 2. API Client (`src/lib/api.ts`)
- **What**: Axios-based API client with typed functions for all 8 endpoints
- **AI Role**: Generated the full API client matching the exact API contracts from the spec
- **Human Review**: Verified each endpoint matches the spec's request/response schemas exactly

### 3. UI Components
- **What**: shadcn/ui based components (Button, Card, Badge, Input, etc.) and custom components (CountdownTimer, SeatProgressBar, HoldStatusBadge, BrnInput)
- **AI Role**: Generated all component code
- **Human Review**: Verified visual consistency and accessibility

### 4. Page Implementation
- **What**: All four screens (Class List, Create Class, Application Details, My Applications)
- **AI Role**: Generated complete page implementations with React Query hooks, mutations, and error handling
- **Human Review**: Verified all UI rules are implemented (auto-refresh, auto-expiry, error messages, localStorage persistence)

### 5. Docker Configuration
- **What**: Dockerfile for frontend and docker-compose.yml for the full stack
- **AI Role**: Generated multi-stage Dockerfile and compose configuration
- **Human Review**: Verified Docker setup matches spec requirements

## AI Mistakes and Corrections

1. **Initial npm install took too long**: The first attempt at creating the project timed out. Resolved by re-running the command with proper wait configuration.

2. **Tailwind CSS v4 compatibility**: The generated project used Tailwind CSS v4 which has different configuration patterns. Adapted the CSS to work with v4's `@import "tailwindcss"` syntax instead of v3's `@tailwind` directives.

3. **shadcn/ui CLI unavailable**: The shadcn CLI requires interactive prompts. Resolved by manually creating the UI components with proper shadcn/ui patterns and CVA (class-variance-authority).

## Conclusion

AI was used as a coding assistant throughout the project. All generated code was reviewed and tested. The AI accelerated development significantly but required human oversight to ensure spec compliance.
