# SQL Comparer Client

[Main README](../README.md) | [Documentation Index](../documents/README.md)

The client is a React + Vite application for managing profiles, SQL parameters, test cases, execution results, and backup and restore workflows.

## Main Features

- Profile management
- Provider-specific connection forms
- SQL connection testing
- SQL parameter editor
- Test case creation and editing
- Latest result viewer with diff table
- Realtime status updates
- Backup and restore actions

## Technology Stack

- React
- TypeScript
- Vite
- Material UI
- Axios
- React Router
- Day.js

## Project Structure

```text
client/
├── src/
│   ├── apis/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── models/
│   ├── pages/
│   └── styles/
├── public/
└── package.json
```

## Pages

### Profiles

Create and manage connection profiles for different database providers.

### SQL Parameters

Define the parameter schema for a profile.

### Test Cases

Manage test case inputs and execution options such as:

- compare in order
- parallel execution
- auto run when SQL changes

### Latest Test Case Result

Inspect:

- execution status
- execution durations
- old and new result differences
- latest error details

## Development

Install dependencies:

```bash
npm install
```

Run the client in development mode:

```bash
npm run dev
```

Default URL:

- `http://localhost:5173`

By default, the client calls the backend at:

- `http://localhost:5000`

You can override this with:

```bash
VITE_API_BASE_URL=http://your-server:5000
```

## Build and Preview

Build the client:

```bash
npm run build
```

Preview the built output:

```bash
npm run preview
```

## UI Notes

- Provider-specific connection forms are rendered dynamically
- The latest result page supports large diff tables with pagination
- Error messages are normalized from API responses before display
