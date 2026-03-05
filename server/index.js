const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
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
        const token = jwt.sign({ user_id: newUser.rows[0].user_id }, process.env.jwtSecret, { expiresIn: "1h" });

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
            return res.status(401).json("Invalid Email");
        }

        // 2. Check if the password is correct (Compare raw password vs. Hash)
        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);

        if (!validPassword) {
            return res.status(401).json("Invalid Password");
        }

        // 3. Generate Token
        const token = jwt.sign(
            { user_id: user.rows[0].user_id, role: user.rows[0].role }, 
            process.env.jwtSecret, 
            { expiresIn: "1h" }
        );

        // 4. Return Token
        res.json({ token });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// FORGOT PASSWORD (Generate Token)
// ==========================================
app.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        // 1. Check if user exists
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        
        if (user.rows.length === 0) {
            // NEW: Explicitly tell the user the email wasn't found
            return res.status(404).json("This email does not exist in our system.");
        }

        // 2. Generate a secure, random 32-character token
        const resetToken = crypto.randomBytes(32).toString("hex");
        
        // 3. Set expiration time (1 hour from right now)
        const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); 

        // 4. Save token to the database for this user
        await pool.query(
            "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3",
            [resetToken, tokenExpiry, email]
        );

        // 5. Simulate sending the email in the terminal (Updated to port 5173!)
        const resetLink = `http://localhost:5173/reset-password/${resetToken}`;
        
        console.log("\n----------------------------------------");
        console.log(`📧 SIMULATED EMAIL TO: ${email}`);
        console.log(`Subject: Volunteer Hub - Password Reset Request`);
        console.log(`Body: Click the link below to reset your password. This link expires in 1 hour.`);
        console.log(`Link:  ${resetLink}`);
        console.log("----------------------------------------\n");

        // NEW: Clear success message
        res.json("Success! A reset link has been sent to your email.");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// RESET PASSWORD (Use Token to set new password)
// ==========================================
app.post("/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // 1. Find user by token AND ensure it hasn't expired
        // NOW() is a Postgres function that gets the current time
        const user = await pool.query(
            "SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()",
            [token]
        );

        if (user.rows.length === 0) {
            return res.status(400).json("Invalid or expired reset token. Please request a new one.");
        }

        // 2. Hash the new password using bcrypt (same as Registration)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 3. Update the password and CLEAR the tokens so they can't be used again
        await pool.query(
            "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE user_id = $2",
            [hashedPassword, user.rows[0].user_id]
        );

        res.json("Password has been successfully reset! You can now log in.");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Get User Name, Role, AND Volunteer Stats
app.get("/dashboard", authorization, async (req, res) => {
    try {
        // 1. Get User Name and Role
        const user = await pool.query(
            "SELECT full_name, role FROM users WHERE user_id = $1", 
            [req.user.user_id]
        );
        
        // 2. Get Volunteer Stats (Count events and Sum hours where status is 'attended')
        // We use COALESCE to return '0' instead of 'null' if they haven't volunteered yet.
        const stats = await pool.query(
            `SELECT 
                COUNT(*) as event_count, 
                COALESCE(SUM(hours_awarded), 0) as total_hours 
             FROM signups 
             WHERE volunteer_id = $1 AND status = 'attended'`,
            [req.user.user_id]
        );

        // 3. Send combined data back to frontend
        res.json({ 
            ...user.rows[0], 
            ...stats.rows[0] 
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Create a Volunteer Event
app.post("/events", authorization, async (req, res) => {
    try {
        // Now accepting 'capacity'
        const { title, description, location, event_date, event_end, capacity } = req.body; 
        
        const newEvent = await pool.query(
            "INSERT INTO events (title, description, location, event_date, event_end, capacity, organizer_id) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [title, description, location, event_date, event_end, capacity, req.user.user_id]
        );
        res.json(newEvent.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Get all events (Includes Organizer Name + Volunteer Count)
app.get("/events", async (req, res) => {
    try {
        const allEvents = await pool.query(
            `SELECT 
                e.*, 
                u.full_name as organizer_name,
                (SELECT COUNT(*) FROM signups s WHERE s.event_id = e.event_id) as current_count,
                (SELECT COUNT(*) FROM comments c WHERE c.event_id = e.event_id) as comment_count
             FROM events e
             JOIN users u ON e.organizer_id = u.user_id
             ORDER BY e.event_date ASC`
        );
        
        // Ensure current_count is a number (Postgres sometimes returns strings for counts)
        const formattedEvents = allEvents.rows.map(event => ({
            ...event,
            current_count: parseInt(event.current_count),
            comment_count: parseInt(event.comment_count)
        }));

        res.json(formattedEvents);
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
            `SELECT 
                e.*,
                (SELECT COUNT(*) FROM comments c WHERE c.event_id = e.event_id) AS comment_count
             FROM events e
             WHERE e.organizer_id = $1
             ORDER BY e.event_date ASC`,
            [req.user.user_id]
        );

        const formattedEvents = myEvents.rows.map(event => ({
            ...event,
            comment_count: parseInt(event.comment_count)
        }));

        res.json(formattedEvents);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Get all attendees for a specific event
app.get("/events/:id/attendees", authorization, async (req, res) => {
    try {
        const { id } = req.params;
        
        // We added check_in_time and check_out_time to this query
        const attendees = await pool.query(
            `SELECT 
                users.full_name, 
                users.email, 
                signups.signup_id, 
                signups.status, 
                signups.hours_awarded,
                signups.check_in_time, 
                signups.check_out_time 
            FROM signups 
            JOIN users ON signups.volunteer_id = users.user_id 
            WHERE signups.event_id = $1`,
            [id]
        );
        
        res.json(attendees.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Update Volunteer Status & Hours (The "Time Clock" Route)
app.put("/signups/:id", authorization, async (req, res) => {
    try {
        const { id } = req.params; // Signup ID
        const { status, check_in, check_out } = req.body;

        let hours = 0;

        // LOGIC: If they attended, calculate the exact duration
        if (status === 'attended' && check_in && check_out) {
            const start = new Date(check_in);
            const end = new Date(check_out);
            
            // Calculate difference in milliseconds
            const diffMs = end - start; 
            
            // Convert to hours (e.g., 2.5 hours)
            hours = diffMs / (1000 * 60 * 60); 

            // Safety check: Prevent negative hours
            if (hours < 0) hours = 0;
        }

        // Update the database
        await pool.query(
            "UPDATE signups SET status = $1, check_in_time = $2, check_out_time = $3, hours_awarded = $4 WHERE signup_id = $5",
            [status, check_in, check_out, hours, id]
        );

        res.json("Attendance updated successfully");
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
        const { title, description, location, event_date, event_end } = req.body;

        const updateEvent = await pool.query(
            "UPDATE events SET title = $1, description = $2, location = $3, event_date = $4, event_end = $5 WHERE event_id = $6",
            [title, description, location, event_date, event_end, id]
        );

        res.json("Event was updated!");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Mark Event as Completed (With Safety Check)
app.put("/events/:id/complete", authorization, async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Check for unprocessed volunteers
        // We look for any rows where status is still the default 'registered'
        const unprocessed = await pool.query(
            "SELECT * FROM signups WHERE event_id = $1 AND status = 'registered'",
            [id]
        );

        if (unprocessed.rows.length > 0) {
            // STOP! Return a 400 error with a specific message
            return res.status(400).json(`Cannot complete event. There are still ${unprocessed.rows.length} volunteers marked as 'Registered'. Please mark them as Attended or Absent first.`);
        }

        // 2. If check passes, mark complete
        await pool.query("UPDATE events SET is_completed = TRUE WHERE event_id = $1", [id]);
        res.json("Event marked as completed");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Volunteer Signup Route (With Capacity Check)
app.post("/events/:id/signup", authorization, async (req, res) => {
    try {
        const { id } = req.params;
        const volunteer_id = req.user.user_id;

        // 1. Get Event Capacity and Current Count
        const eventInfo = await pool.query(
            `SELECT capacity, 
            (SELECT COUNT(*) FROM signups WHERE event_id = $1) as current_count 
            FROM events WHERE event_id = $1`, 
            [id]
        );

        const limit = eventInfo.rows[0].capacity;
        const current = parseInt(eventInfo.rows[0].current_count);

        // 2. CHECK: Is it full? (Only if a limit exists)
        if (limit !== null && current >= limit) {
            return res.status(400).json("Sorry, this event has reached maximum capacity!");
        }

        // 3. Check if already signed up (Existing logic)
        const check = await pool.query(
            "SELECT * FROM signups WHERE volunteer_id = $1 AND event_id = $2",
            [volunteer_id, id]
        );

        if (check.rows.length > 0) {
            return res.status(400).json("You are already registered for this event!");
        }

        // 4. Insert new signup
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

// Get all events a specific volunteer has signed up for
app.get("/my-signups", authorization, async (req, res) => {
    try {
        const volunteer_id = req.user.user_id;

        const mySignups = await pool.query(
            `SELECT events.*, 
                    signups.status, 
                    signups.hours_awarded, 
                    signups.check_in_time, 
                    signups.check_out_time,
                    users.full_name as organizer_name,
                    -- NEW LINE BELOW: Calculates total signups for this event
                    (SELECT COUNT(*) FROM signups s2 WHERE s2.event_id = events.event_id) AS current_count
             FROM signups 
             JOIN events ON signups.event_id = events.event_id 
             JOIN users ON events.organizer_id = users.user_id 
             WHERE signups.volunteer_id = $1 
             ORDER BY events.event_date ASC`,
            [volunteer_id]
        );

        res.json(mySignups.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Unregister (Cancel Signup)
app.delete("/events/:id/signup", authorization, async (req, res) => {
    try {
        const { id } = req.params; // Event ID
        const volunteer_id = req.user.user_id; // From token

        // Delete the specific signup record
        await pool.query(
            "DELETE FROM signups WHERE volunteer_id = $1 AND event_id = $2",
            [volunteer_id, id]
        );

        res.json("Unregistered successfully");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// GET LEADERBOARD DATA (FIXED)
app.get("/leaderboard", async (req, res) => {
    try {
        // 1. FIX: Select 'full_name' instead of first/last
        const leaderboard = await pool.query(
            `SELECT 
                u.full_name, 
                COUNT(s.signup_id) as event_count, 
                COALESCE(SUM(s.hours_awarded), 0) as total_hours 
             FROM users u 
             JOIN signups s ON u.user_id = s.volunteer_id 
             WHERE s.status = 'attended' 
             GROUP BY u.user_id, u.full_name
             ORDER BY total_hours DESC`
        );
        
        // 2. FIX: Manually split the full name into "First L."
        const formattedData = leaderboard.rows.map(row => {
            const nameParts = row.full_name.trim().split(" ");
            const firstName = nameParts[0];
            // If they have a last name, get the first letter. Otherwise leave blank.
            const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0) : "";
            
            return {
                name: `${firstName} ${lastInitial}.`,
                event_count: parseInt(row.event_count),
                total_hours: parseFloat(row.total_hours)
            };
        });

        res.json(formattedData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// 1. POST A REVIEW
app.post("/events/:id/reviews", authorization, async (req, res) => {
    try {
        const event_id = req.params.id;
        const { rating, comment } = req.body;
        const user_id = req.user.user_id; // From token

        const newReview = await pool.query(
            "INSERT INTO reviews (event_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *",
            [event_id, user_id, rating, comment]
        );
        res.json(newReview.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// 2. GET REVIEWS FOR AN EVENT
app.get("/events/:id/reviews", async (req, res) => {
    try {
        const { id } = req.params;
        const reviews = await pool.query(
            `SELECT r.*, u.full_name 
             FROM reviews r 
             JOIN users u ON r.user_id = u.user_id 
             WHERE r.event_id = $1 
             ORDER BY r.created_at DESC`,
            [id]
        );
        res.json(reviews.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});



app.post("/events/:id/comments", authorization, async (req, res) => {
    try {
        const event_id = req.params.id;
        const { content } = req.body;
        const user_id = req.user.user_id;

        if (!content || content.trim() === "") {
            return res.status(400).json("Comment cannot be empty");
        }

        const newComment = await pool.query(
            "INSERT INTO comments (event_id, user_id, content) VALUES ($1, $2, $3) RETURNING *",
            [event_id, user_id, content]
        );

        res.json(newComment.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

app.get("/events/:id/comments", authorization, async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.user_id;

        const comments = await pool.query(
            `SELECT c.comment_id, c.content, c.created_at, u.full_name,
            CASE 
                    WHEN e.organizer_id = c.user_id THEN true 
                    ELSE false 
                END AS is_organizer,
                CASE
                    WHEN c.user_id = $2 OR e.organizer_id = $2 THEN true
                    ELSE false
                END AS can_delete
             FROM comments c
             JOIN users u ON c.user_id = u.user_id
             JOIN events e ON c.event_id = e.event_id
             WHERE c.event_id = $1
             ORDER BY c.created_at DESC`,
            [id, currentUserId]
        );

        res.json(comments.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});
    app.delete("/events/:eventId/comments/:commentId", authorization, async (req, res) => {
    try {
        const { eventId, commentId } = req.params;
        const currentUserId = req.user.user_id;

        const commentCheck = await pool.query(
            `SELECT 
                c.user_id,
                e.organizer_id
             FROM comments c
             JOIN events e ON c.event_id = e.event_id
             WHERE c.comment_id = $1 AND c.event_id = $2`,
            [commentId, eventId]
        );

        if (commentCheck.rows.length === 0) {
            return res.status(404).send("Comment not found");
        }

        const { user_id, organizer_id } = commentCheck.rows[0];

        if (currentUserId !== user_id && currentUserId !== organizer_id) {
            return res.status(403).send("Not authorized to delete this comment");
        }

        await pool.query(
            "DELETE FROM comments WHERE comment_id = $1 AND event_id = $2",
            [commentId, eventId]
        );

        res.send("Comment deleted successfully");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});