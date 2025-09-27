import express from "express";
import path from "path";
import cors from "cors";
import mongoose from "mongoose";
import { fileURLToPath } from 'url';

// --- Environment Variables ---
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/arcade_platform";
const PORT = process.env.PORT || 5000;
// const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; // For full validation in production

// --- Express App Setup ---
const app = express();
app.use(cors());
app.use(express.json());

// --- Mongoose Setup ---
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected successfully."))
  .catch(err => console.error("MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  username: String,
  firstName: String,
  lastName: String,
  score: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  lastLogin: { type: Date, default: Date.now },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

const User = mongoose.model('User', userSchema);

// --- API Endpoints ---
app.post("/api/auth/telegram", async (req, res) => {
    const { telegramId, username, firstName, lastName } = req.body;

    if (!telegramId) {
        return res.status(400).json({ message: "Missing Telegram User ID." });
    }
    
    // NOTE: In a real production environment, you would implement full hash validation
    // using the TELEGRAM_BOT_TOKEN to ensure the request is legitimate and from Telegram.
    
    try {
        let user = await User.findOne({ telegramId: telegramId });

        if (!user) {
            user = new User({
                telegramId,
                username: username || `${firstName} ${lastName || ''}`.trim(),
                firstName,
                lastName: lastName || '',
            });
        } else {
            user.username = username || `${firstName} ${lastName || ''}`.trim();
            user.firstName = firstName;
            user.lastName = lastName || '';
            user.lastLogin = new Date();
        }
        await user.save();
        
        res.json({
            telegramId: user.telegramId,
            username: user.username,
            score: user.score,
            coins: user.coins,
        });
    } catch (error) {
        console.error("Error during Telegram authentication:", error);
        res.status(500).json({ message: "Server error during authentication." });
    }
});

app.post("/api/users/updateScore", async (req, res) => {
    const { telegramId, newScore, newCoins } = req.body;
    if (!telegramId || newScore === undefined || newCoins === undefined) {
        return res.status(400).json({ message: "Missing required fields." });
    }
    try {
        const user = await User.findOneAndUpdate(
            { telegramId },
            { $set: { score: newScore, coins: newCoins } },
            { new: true, upsert: false }
        );
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        res.json(user);
    } catch (error) {
        console.error("Error updating score:", error);
        res.status(500).json({ message: "Server error while updating score." });
    }
});

app.post("/api/users/withdraw", async (req, res) => {
    const { telegramId, amount, address } = req.body;
    try {
        const user = await User.findOne({ telegramId });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        if (user.coins < amount) {
            return res.status(400).json({ message: "Insufficient funds." });
        }
        
        // In a real application, you would integrate with the Toncoin blockchain API here
        console.log(`Simulating withdrawal: ${amount} TON to ${address} for user ${telegramId}`);
        
        user.coins -= amount;
        await user.save();
        
        res.json({ message: "Withdrawal request processed.", newCoins: user.coins });
    } catch (error) {
        console.error("Error during withdrawal:", error);
        res.status(500).json({ message: "Server error during withdrawal." });
    }
});

// --- Static File Serving ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "..", "frontend", "dist");

app.use(express.static(frontendDistPath));

app.get("*", (req, res) => {
    res.sendFile(path.resolve(frontendDistPath, "index.html"));
});

// --- Server Start ---
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
