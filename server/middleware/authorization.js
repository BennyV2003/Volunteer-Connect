const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = async (req, res, next) => {
    try {
        // 1. Get the token from the header
        const jwtToken = req.header("token");

        if (!jwtToken) {
            return res.status(403).json("Not Authorized");
        }

        // 2. Check if the token is valid
        const payload = jwt.verify(jwtToken, "secretKey123");

        // 3. If valid, add the user info to the request so we can use it later
        req.user = payload;
        next(); // 4. Continue to the actual route

    } catch (err) {
        console.error(err.message);
        return res.status(403).json("Not Authorized");
    }
};