# VolunteerConnect

VolunteerConnect is our Spring 2026 senior capstone at UTRGV, built by two senior teammates.

Organizations post events and record attendance. Volunteers can find events, sign up, track their hours, and download participation certificates. Volunteers and organizers can also post event comments. Comment authors and the event organizer can delete comments.

Built with React, Node.js, Express, and PostgreSQL.

## Run locally

You'll need Node.js and a running PostgreSQL instance. Run each command on its own line.
---------------------------------------------------------------------------------
From the project folder, create the database and tables:

createdb volunteer_db

psql -v ON_ERROR_STOP=1 -d volunteer_db -f client/public/database.sql

Install the backend dependencies and copy the settings file:

cd server

npm install

cp .env.example .env
---------------------------------------------------------------------------------
Fill in your database credentials and JWT secret in .env, then start the backend:

node index.js

In another terminal, start from the project folder:

cd client

npm install

npm run dev

Open the address Vite prints. Keep both terminals running.
-----------------------------------------------------------------------------------
There are no preloaded accounts or events. Register as an organization to create an event, then use a volunteer account to sign up.

## Notes

- Password-reset links print in the backend terminal. No email is sent.
- The backend uses port 5000. AirPlay Receiver on macOS can occupy that port.

## Existing database

If you already set up the app before comments were added, run this from the project folder:

psql -v ON_ERROR_STOP=1 -d volunteer_db -f server/migrations/001_add_comments.sql

Restart the backend after updating.
