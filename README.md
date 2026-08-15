# IR Section Controller

IR Section Controller is a robust web application for managing Indian Railways section data, master data, timetables, and eventual controller decision support.

## Architecture
The project follows a standard MERN-stack pattern separated into `client` and `server` workspaces.
See `docs/architecture/README.md` for more details.

## Setup
Ensure Node.js and Docker are installed.
```bash
npm install
docker compose up -d mongodb redis
```

## Running the Application
```bash
npm run dev
```

## Testing
```bash
npm test
```
