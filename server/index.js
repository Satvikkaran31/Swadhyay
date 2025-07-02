import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url'; // Required for __dirname in ES modules
import MongoStore from 'connect-mongo';
import calendarRoutes from "./routes/calendarRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import authRoutes from './routes/authRoutes.js';
import availabilityRoutes from "./routes/availabilityRoutes.js";
import { ensureAuthenticated } from "./controllers/auth.js";
import connectRedis from 'connect-redis';
import Redis from 'ioredis';
import { createClient } from 'redis';
dotenv.config();

const app = express();

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const redisClient = createClient({
  url: process.env.REDIS_URL,
  legacyMode: true, 
});
redisClient.connect().catch(console.error);

//Session with Redis
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
}));


app.use(cors({
  origin: ["http://localhost:3000", "https://swadhyay.onrender.com"],
  credentials: true,
}));


app.use(bodyParser.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use("/api/payment", ensureAuthenticated, paymentRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/availability", availabilityRoutes);


// Serving frontend
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

app.listen(process.env.PORT || 5000, () =>
  console.log("Server running on port", process.env.PORT || 5000)
);
