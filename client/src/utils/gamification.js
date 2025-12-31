// This file holds the "One Source of Truth" for your game logic.

export const calculateLevelInfo = (hours) => {
    // 1. Calculate Level
    // Formula: Level = sqrt(hours * 20)
    let currentLevel = Math.floor(Math.sqrt(hours * 20));
    if (currentLevel < 1) currentLevel = 1;
    if (currentLevel > 100) currentLevel = 100; 

    // 2. Define Titles & Colors
    // We can return a specific color for each tier to make it look cool without icons
    const tiers = [
        { title: "Neighborhood Scout", color: "#777" },       // Grey (Basic)
        { title: "Active Citizen", color: "#28a745" },        // Green
        { title: "Community Builder", color: "#17a2b8" },     // Teal
        { title: "Dedicated Advocate", color: "#007bff" },    // Blue
        { title: "Impact Leader", color: "#6610f2" },         // Indigo
        { title: "Lead Mentor", color: "#6f42c1" },           // Purple
        { title: "Grand Humanitarian", color: "#e83e8c" },    // Pink
        { title: "Civic Visionary", color: "#fd7e14" },       // Orange
        { title: "Champion of the People", color: "#dc3545" },// Red
        { title: "Legendary Philanthropist", color: "#d4af37" } // GOLD!
    ];
    
    // Calculate Tier Index (0-9)
    let tierIndex = Math.floor(currentLevel / 10);
    if (tierIndex >= tiers.length) tierIndex = tiers.length - 1; 
    
    const currentTier = tiers[tierIndex];

    // 3. Calculate Progress
    const prevLevelHours = Math.pow(currentLevel, 2) / 20;
    const nextLevelHours = Math.pow(currentLevel + 1, 2) / 20;
    
    let progressPercent = 0;
    if (currentLevel < 100) {
        const totalRange = nextLevelHours - prevLevelHours;
        const progress = hours - prevLevelHours;
        progressPercent = (progress / totalRange) * 100;
        progressPercent = Math.max(0, Math.min(100, progressPercent));
    } else {
        progressPercent = 100;
    }

    return { 
        currentLevel, 
        currentTitle: currentTier.title, 
        tierColor: currentTier.color, // <--- We now return a color!
        progressPercent, 
        nextLevelHours 
    };
};