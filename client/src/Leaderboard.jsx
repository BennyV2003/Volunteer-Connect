import { useEffect, useState } from "react";

// 1. Accept 'currentUser' prop (e.g., "Kira Martinez")
const Leaderboard = ({ currentUser }) => {
    const [leaders, setLeaders] = useState([]);
    const [sortBy, setSortBy] = useState("hours"); 

    useEffect(() => {
        const getLeaderboard = async () => {
            try {
                const response = await fetch("http://localhost:5000/leaderboard");
                const jsonData = await response.json();
                setLeaders(jsonData);
            } catch (err) {
                console.error(err.message);
            }
        };
        getLeaderboard();
    }, []);

    const sortedLeaders = [...leaders].sort((a, b) => {
        if (sortBy === "hours") return b.total_hours - a.total_hours;
        return b.event_count - a.event_count;
    });

    // Helper: Convert decimal hours to "3h 30m"
    const formatHoursToTime = (decimalHours) => {
        if (!decimalHours) return "0h 0m";
        const hours = Math.floor(decimalHours);
        const minutes = Math.round((decimalHours - hours) * 60);
        return `${hours}h ${minutes}m`;
    };

    // --- NEW HELPER: Format current user's name to match Leaderboard format ---
    // Input: "Kira Martinez" -> Output: "Kira M."
    const formatCurrentUserName = (fullName) => {
        if (!fullName) return "";
        const parts = fullName.trim().split(" ");
        const first = parts[0];
        const lastInitial = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
        return `${first} ${lastInitial}.`;
    };

    const myFormattedName = formatCurrentUserName(currentUser);

    // --- STYLES ---
    const activeTabStyle = {
        backgroundColor: "#FF5E17", color: "white", border: "none", 
        padding: "10px 20px", cursor: "pointer", fontWeight: "bold",
        borderRadius: "20px"
    };
    
    const inactiveTabStyle = {
        backgroundColor: "#eee", color: "#666", border: "none", 
        padding: "10px 20px", cursor: "pointer", fontWeight: "bold",
        borderRadius: "20px"
    };

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", backgroundColor: "white", padding: "30px", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
            <h2 style={{ textAlign: "center", color: "#333", marginBottom: "30px" }}>🏆 Volunteer Leaderboard</h2>

            <div style={{ display: "flex", justifyContent: "center", gap: "15px", marginBottom: "30px" }}>
                <button onClick={() => setSortBy("hours")} style={sortBy === "hours" ? activeTabStyle : inactiveTabStyle}>
                    Top Hours
                </button>
                <button onClick={() => setSortBy("events")} style={sortBy === "events" ? activeTabStyle : inactiveTabStyle}>
                    Most Events
                </button>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ borderBottom: "2px solid #eee", color: "#888", fontSize: "0.9rem" }}>
                        <th style={{ textAlign: "left", padding: "15px" }}>Rank</th>
                        <th style={{ textAlign: "left", padding: "15px" }}>Volunteer</th>
                        <th style={{ textAlign: "right", padding: "15px" }}>
                            {sortBy === "hours" ? "Total Time" : "Events Attended"}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedLeaders.map((person, index) => {
                        // CHECK MATCH
                        const isMe = person.name === myFormattedName;

                        return (
                            <tr key={index} style={{ 
                                borderBottom: "1px solid #f9f9f9",
                                // Highlight Logic: Use UTRGV Orange background if it's me!
                                backgroundColor: isMe ? "#fff3e0" : "white",
                                borderLeft: isMe ? "5px solid #FF5E17" : "none" 
                            }}>
                                <td style={{ padding: "15px", fontWeight: "bold", color: index < 3 ? "#FF5E17" : "#555" }}>
                                    {index + 1} {index === 0 && "👑"}
                                </td>
                                <td style={{ padding: "15px", fontSize: "1.1rem", fontWeight: isMe ? "bold" : "500", color: isMe ? "#e65100" : "inherit" }}>
                                    {person.name} {isMe && "(You)"}
                                </td>
                                <td style={{ padding: "15px", textAlign: "right", fontWeight: "bold", color: "#333" }}>
                                    {sortBy === "hours" 
                                        ? formatHoursToTime(person.total_hours) 
                                        : person.event_count}
                                </td>
                            </tr>
                        );
                    })}
                    {sortedLeaders.length === 0 && (
                        <tr><td colSpan="3" style={{ textAlign: "center", padding: "20px" }}>No data yet.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Leaderboard;