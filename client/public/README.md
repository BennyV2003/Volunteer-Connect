# Volunteer Management App

## Prerequisites
1. Node.js installed
2. PostgreSQL installed

## Setup Instructions

### 1. Database Setup
1. Create a Postgres database named `volunteer_db`.
2. Run the commands in `server/database.sql` inside your SQL query tool to create the tables.

### 2. Server Setup
1. Open a terminal in the `/server` folder.
2. Run `npm install` to download dependencies.
3. Create a `.env` file (copy `.env.example`) and add your DB password.
4. Run `npx nodemon index.js` to start the backend.

### 3. Client Setup
1. Open a new terminal in the `/client` folder.
2. Run `npm install` to download dependencies.
3. Run `npm run dev` to launch the frontend.

### 4. Closing the project
1. Use ctrl+c in the terminal to kill the server.
2. Use ctrl+c in the terminal to kill the client.