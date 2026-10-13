# Student Project Tracker — Live Version

## Overview

This is a hands-on web application development project. This live variant uses **Vercel** for hosting and **Supabase PostgreSQL** for database storage.

The application allows users to add, view, edit and delete student project records.

## Technology Stack

- HTML, CSS and JavaScript for the frontend
- Node.js and Express for the server and API
- Supabase PostgreSQL for persistent database storage
- Vercel for deployment

## Run Locally

Use Node.js 22 or a compatible workshop version.

1. Install the dependencies:

   ```powershell
   npm.cmd ci
   ```

2. Create a private `.env` file by copying `.env.example` and naming the copy `.env`.

3. Set `DATABASE_URL` in `.env` to your own Supabase PostgreSQL Transaction Pooler connection string.

4. Create the database table by running the contents of `schema.sql` in the Supabase SQL Editor.

5. Start the local server:

   ```powershell
   npm.cmd start
   ```

6. Open `http://localhost:3000` in your browser.

## Database Configuration

The server reads `DATABASE_URL` from the environment. This variable is server-only and must never be placed in frontend JavaScript or committed to GitHub.

Each person running this project must configure their own Supabase database credentials. Never share your database password or connection string.

The database schema is provided in `schema.sql`.

## API

The application provides API routes for listing, creating, updating and deleting projects. The frontend uses relative API paths so the same interface can work locally and when hosted.

The `/api/health` endpoint can be used to check server health. A successful health response alone does not prove that database queries work.

## Data and Security Notes

- This is a demonstration application with shared project records and no sign-in system.
- Anyone who can access the application may be able to interact with its shared records.
- Use synthetic demonstration data, not personal or confidential information.
- The original SQLite database records are not automatically migrated to Supabase.
- The `.env` file must remain private. The `.env.example` file contains only a placeholder.

## Deployment

The application is intended to be deployed using Vercel with Supabase PostgreSQL.

**Hosted application URL:** To be added after deployment is completed and verified.

Do not assume the application is deployed until its hosted URL and database operations have been tested.