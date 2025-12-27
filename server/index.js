const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authorization = require("./middleware/authorization");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test Route
app.get("/", (req, res) => {
    res.send("Hello from the Backend!");
});

// Example Database Route
app.get("/users", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM users");
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Register Route
app.post("/register", async (req, res) => {
    try {
        const { email, password, full_name, role } = req.body;

        // 1. Check if user exists
        const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userCheck.rows.length > 0) {
            return res.status(401).json("User already exists!");
        }

        // 2. Hash the password (The "Salt" is the complexity level)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Insert into Database
        const newUser = await pool.query(
            "INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING *",
            [email, hashedPassword, full_name, role]
        );

        // 4. Generate a Token (The "Badge")
        const token = jwt.sign({ user_id: newUser.rows[0].user_id }, "secretKey123", { expiresIn: "1h" });

        // 5. Send back the token
        res.json({ token });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Login Route
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check if user exists
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        
        if (user.rows.length === 0) {
            return res.status(401).json("Invalid Credential");
        }

        // 2. Check if the password is correct (Compare raw password vs. Hash)
        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);

        if (!validPassword) {
            return res.status(401).json("Invalid Credential");
        }

        // 3. Generate Token
        const token = jwt.sign(
            { user_id: user.rows[0].user_id, role: user.rows[0].role }, 
            "secretKey123", 
            { expiresIn: "1h" }
        );

        // 4. Return Token
        res.json({ token });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Protected Dashboard Route
app.get("/dashboard", authorization, async (req, res) => {
    try {
        // req.user has the payload (user_id) because the middleware put it there!
        const user = await pool.query("SELECT full_name, role FROM users WHERE user_id = $1", [req.user.user_id]); 
        
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Create Event Route
app.post("/events", authorization, async (req, res) => {
    try {
        const { title, description, event_date, location } = req.body;
        
        // We get req.user.user_id from the token verification step!
        const organizer_id = req.user.user_id;

        const newEvent = await pool.query(
            "INSERT INTO events (organizer_id, title, description, event_date, location) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [organizer_id, title, description, event_date, location]
        );

        res.json(newEvent.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Get All Events (Public Route - No Token Needed)
app.get("/events", async (req, res) => {
    try {
        const allEvents = await pool.query(
            "SELECT events.*, users.full_name as organizer FROM events JOIN users ON events.organizer_id = users.user_id"
        );
        res.json(allEvents.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Get specific Organization's events (Protected)
app.get("/my-events", authorization, async (req, res) => {
    try {
        // req.user.user_id comes from the 'authorization' middleware
        const myEvents = await pool.query(
            "SELECT * FROM events WHERE organizer_id = $1 ORDER BY event_date ASC",
            [req.user.user_id]
        );
        res.json(myEvents.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// 1. Get List of Volunteers for a specific event
app.get("/events/:id/attendees", authorization, async (req, res) => {
    try {
        const { id } = req.params; // The event_id
        const attendees = await pool.query(
            "SELECT s.signup_id, s.status, s.hours_awarded, u.full_name, u.email FROM signups s JOIN users u ON s.volunteer_id = u.user_id WHERE s.event_id = $1",
            [id]
        );
        res.json(attendees.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// 2. Mark a Volunteer as Present (Update Status)
app.put("/signups/:id", authorization, async (req, res) => {
    try {
        const { id } = req.params; // signup_id
        const { status, hours_awarded } = req.body;
        
        await pool.query(
            "UPDATE signups SET status = $1, hours_awarded = $2 WHERE signup_id = $3",
            [status, hours_awarded, id]
        );
        res.json("Updated successfully");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// 3. Delete an Event
app.delete("/events/:id", authorization, async (req, res) => {
    try {
        const { id } = req.params;
        // IMPORTANT: We must delete the signups first, or the database will yell at us (Foreign Key Constraint)
        await pool.query("DELETE FROM signups WHERE event_id = $1", [id]);
        await pool.query("DELETE FROM events WHERE event_id = $1", [id]);
        res.json("Event Deleted");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Update Event Details
app.put("/events/:id", authorization, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, location, event_date } = req.body;

        // Update the event in the database
        const updateEvent = await pool.query(
            "UPDATE events SET title = $1, description = $2, location = $3, event_date = $4 WHERE event_id = $5 RETURNING *",
            [title, description, location, event_date, id]
        );

        res.json("Event was updated!");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Mark Event as Completed
app.put("/events/:id/complete", authorization, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("UPDATE events SET is_completed = TRUE WHERE event_id = $1", [id]);
        res.json("Event marked as completed");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Volunteer Signup Route
app.post("/events/:id/signup", authorization, async (req, res) => {
    try {
        const { id } = req.params; // Event ID
        const volunteer_id = req.user.user_id; // Vic's ID from the token

        // 1. Check if already signed up
        const check = await pool.query(
            "SELECT * FROM signups WHERE volunteer_id = $1 AND event_id = $2",
            [volunteer_id, id]
        );

        if (check.rows.length > 0) {
            return res.status(400).json("You are already registered for this event!");
        }

        // 2. Insert new signup
        await pool.query(
            "INSERT INTO signups (volunteer_id, event_id) VALUES ($1, $2)",
            [volunteer_id, id]
        );

        res.json("Signup Successful!");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});