# SQL Comparer Server

[Main README](../README.md) | [Documentation Index](../documents/README.md)

The server is an Express + TypeScript backend that manages profiles, SQL parameters, test cases, SQL execution, result comparison, backup and restore, and generated artifacts.

## What The Server Is Responsible For

- Store metadata in JSON files
- Expose REST APIs for profile and test case management
- Test database connections
- Execute old and new SQL queries
- Compare result sets
- Write execution artifacts to disk
- Watch SQL files for auto-run scenarios
- Stream realtime test case events to the client
- Export and restore profile backups

## Runtime Stack

- Node.js
- Express
- TypeScript
- Swagger UI
- JSON file storage
- `mssql`
- `pg`
- `mysql2`

## Project Structure

```text
server/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   │   └── sql-providers/
│   ├── types/
│   └── index.ts
├── data/
├── docs/
└── package.json
```

## Architecture

```text
HTTP Request
  -> Route
  -> Controller
  -> Service
  -> Repository
  -> JSON file storage
```

Provider-specific SQL execution is isolated in `src/services/sql-providers/`.

## Key Modules

### Profiles

Manage:

- provider
- connection settings
- SQL file paths

### SQL Parameters

Define the input schema used by test cases.

### Test Cases

Store:

- parameter payload
- execution status
- execution counters
- auto-run setting
- compare mode
- parallel execution setting

### SQL Execution

The SQL service:

- loads profile and test case data
- reads SQL files
- binds parameters
- executes queries
- compares old and new results
- persists artifacts and execution metadata

## API Overview

Main route groups:

- `/api/profiles`
- `/api/sql-parameters`
- `/api/test-cases`
- `/api/sql`

Swagger UI:

- `http://localhost:5000/api-docs`

## Development

Install dependencies:

```bash
npm install
```

Run backend only:

```bash
npm run dev
```

Run backend + frontend from the server package:

```bash
npm run dev:fullstack
```

## Build and Serve

Build server:

```bash
npm run build
```

Build server + client:

```bash
npm run build:all
```

Run built backend:

```bash
npm run start
```

Run built backend + built frontend preview:

```bash
npm run serve
```

## Data Storage

Metadata is stored under `server/data/`:

- `profiles.json`
- `sql-parameters.json`
- `test-cases.json`

Execution artifacts are stored under:

- `server/data/results/<profileId>/<testCaseId>/...`

## Notes

- This backend does not use a metadata database
- SQL Server Windows Authentication depends on the host machine driver environment
- Profile deletion also removes dependent test cases, SQL parameters, and result folders
