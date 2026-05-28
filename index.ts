import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export interface CyberChallenge {
  type: "scenario" | "email" | "link";
  title: string;
  description: string;
  data: any;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export const generateCyberQuestion = async (difficulty: string): Promise<CyberChallenge> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is not set.");
  }

  const challengeTypes = ["scenario", "email", "link"];
  const selectedType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];

  const topics = [
    "UPI payment link scam",
    "Fake bank KYC update call",
    "Digital Arrest (fake police/CBI call)",
    "Work from home / Part-time job fraud",
    "Fake electricity bill payment SMS",
    "SIM swap fraud",
    "OLX/Marketplace QR code scam",
    "Fake courier/parcel delivery issue",
    "Social media account hijacking",
    "Investment/Stock market tips scam"
  ];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Cyber Awareness App"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b:free",
        messages: [
          {
            role: "system",
            content: `You are a cybersecurity expert. Generate a unique, highly realistic cybersecurity challenge for a user in India.
            
            Challenge Types:
            1. 'scenario': A text-based story where the user must decide what to do.
            2. 'email': A phishing email simulation. 'data' should be an object with { from, subject, body }.
            3. 'link': A malicious link identification task. 'data' should be a string (the URL).
            
            Avoid generic templates. Use specific details like app names, common Indian names, or realistic dialogue.`
          },
          {
            role: "user",
            content: `Generate a '${selectedType}' challenge focusing on: ${randomTopic}. 
            Difficulty: ${difficulty}.
            The response MUST be a valid JSON object strictly following this structure: 
            - type (string: 'scenario', 'email', or 'link')
            - title (string: short title)
            - description (string: instructions for the user)
            - data (any: the content based on type)
            - options (array of 4 strings)
            - correctAnswer (string, must match one of the options exactly)
            - explanation (string)
            - difficulty (string: Easy, Medium, or Hard).
            Do not include any other text outside the JSON block.`
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    const data = await response.json();
    let content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "";

    // Safely extract JSON in case of markdown formatting
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const parsed = JSON.parse(content);
      return parsed;
    } catch (e) {
      console.error("JSON parse failed. Raw response:", content);
      throw new Error("Invalid response format from AI");
    }
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return {
      type: "scenario",
      title: "Suspicious Payment Request",
      description: "You receive an urgent message about a failed payment.",
      data: "Hello, your bank account will be blocked today if you do not complete KYC. Click here to verify: http://bank-kyc-update-alert.com/login",
      options: [
        "Click the link immediately",
        "Reply asking for details",
        "Ignore and contact the bank via official channels",
        "Forward to friends warning them"
      ],
      correctAnswer: "Ignore and contact the bank via official channels",
      explanation: "Banks never send SMS with arbitrary links for KYC. Always use the official banking app or website.",
      difficulty: "Easy"
    };
  }
};

export const getChatbotResponse = async (userQuery: string): Promise<string> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return "I'm sorry, the AI assistant is not configured. Please set the OPENROUTER_API_KEY.";
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Cyber Awareness App"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b:free",
        messages: [
          {
            role: "system",
            content: `You are a helpful cybersecurity awareness assistant. 
            Respond in simple, non-technical language. 
            Provide prevention advice. 
            Suggest reporting to 1930 if applicable. 
            Encourage playing the cyber challenge. 
            Keep responses under 150 words. 
            Never provide instructions on committing fraud. 
            Always encourage reporting scams.
            IMPORTANT: Do not use any markdown formatting like bold (**) or italics (*). Return plain text only.`
          },
          {
            role: "user",
            content: userQuery
          }
        ]
      })
    });

    if (!response.ok) {
      return "I'm having trouble connecting to my brain right now. Please try again later.";
    }

    const data = await response.json();
    return data.choices[0].message.content || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Chatbot Error:", error);
    return "I'm offline right now, but always remember to double-check links and never share your OTP!";
  }
};

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/CCG2";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-guardiq";

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB (CCG2)"))
  .catch((err) => console.error("MongoDB connection error:", err));

// MongoDB Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: { type: String },
  otpExpires: { type: Date },
  xp: { type: Number, default: 0 },
  level: { type: String, default: 'Rookie 🌱' },
  total_score: { type: Number, default: 0 },
  games_played: { type: Number, default: 0 },
  consecutive_correct: { type: Number, default: 0 },
  difficulty_level: { type: String, default: 'Easy' },
  completed_guides: { type: [String], default: [] },
  badges: { type: [String], default: [] },
  isVerified: { type: Boolean, default: false }
}, { collection: 'ccg2' });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Email Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const app = express();
app.use(express.json());

// Middleware to protect routes
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
  });
};

// Auth Routes
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    const existingUser = await User.findOne({
      $or: [ { username: normalizedUsername }, { email: normalizedEmail } ]
    });

    if (existingUser) {
      if (existingUser.username === normalizedUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }
      return res.status(400).json({ error: "Email already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    const newUser = new User({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      otp,
      otpExpires,
      isVerified: false
    });

    await newUser.save();

    try {
      await transporter.sendMail({
        from: `"GuardIQ Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verify Your GuardIQ Account",
        html: `<div style="font-family: sans-serif; padding: 20px;"><h2>Welcome to GuardIQ!</h2><p>Your verification code is: <strong>${otp}</strong></p></div>`,
      });
      res.status(201).json({ message: "OTP sent for verification", requiresVerification: true });
    } catch (mailError) {
      console.error("Mail error during registration:", mailError);
      res.status(201).json({ message: "User registered, but failed to send verification email.", requiresVerification: true });
    }
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const trimmedIdentifier = identifier.trim();
    const user = await User.findOne({
      $or: [{ username: trimmedIdentifier }, { email: trimmedIdentifier.toLowerCase() }]
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    const { password: _, ...userResponse } = user.toObject();
    res.json({ token, user: userResponse });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/verify-otp", async (req, res) => {
  try {
    const { username, otp } = req.body;
    const user = await User.findOne({
      $or: [{ username: username.trim() }, { email: username.trim().toLowerCase() }]
    });

    if (!user || !user.otp || !user.otpExpires || new Date() > user.otpExpires || user.otp !== otp) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    user.isVerified = true;
    await user.save();

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    const { password: _, ...userResponse } = user.toObject();
    res.json({ token, user: userResponse });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/user", authenticateToken, async (req: any, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/generate-question", async (req, res) => {
  try {
    const { difficulty } = req.query;
    const question = await generateCyberQuestion(difficulty as string || 'Easy');
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate question" });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const response = await getChatbotResponse(message);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: "Chatbot error" });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const topUsers = await User.find().select("username xp level").sort({ xp: -1 }).limit(10);
    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

app.post("/api/complete-guide", authenticateToken, async (req: any, res) => {
  try {
    const { guideTitle } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.completed_guides.includes(guideTitle)) {
      user.completed_guides.push(guideTitle);
      user.xp += 15;
      user.total_score += 15;
      await user.save();
    }
    res.json({ success: true, user: { xp: user.xp, total_score: user.total_score, completed_guides: user.completed_guides } });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/update-progress", authenticateToken, async (req: any, res) => {
  try {
    const { correct, xp_gained } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const xpDelta = correct ? Math.abs(xp_gained) : -Math.abs(xp_gained);
    user.xp = Math.max(0, user.xp + xpDelta);
    user.total_score += (correct ? Math.max(0, xpDelta) : 0);
    user.games_played += 1;
    user.consecutive_correct = correct ? user.consecutive_correct + 1 : 0;

    if (user.consecutive_correct >= 3) {
      if (user.difficulty_level === 'Easy') user.difficulty_level = 'Medium';
      else if (user.difficulty_level === 'Medium') user.difficulty_level = 'Hard';
      user.consecutive_correct = 0;
    }

    if (user.xp >= 600) user.level = 'Cyber Guardian 🛡️';
    else if (user.xp >= 300) user.level = 'Cyber Guard ⚔️';
    else if (user.xp >= 100) user.level = 'Defender 🛡️';
    else user.level = 'Rookie 🌱';

    await user.save();
    res.json({ success: true, user: { xp: user.xp, level: user.level, total_score: user.total_score, difficulty_level: user.difficulty_level } });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Export for Vercel
export default app;
