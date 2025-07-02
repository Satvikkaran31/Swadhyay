import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

// Routes & middleware
import calendarRoutes from "./routes/calendarRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import { ensureAuthenticated } from "./controllers/auth.js";

// Redis & connect-redis
import Redis from "ioredis";
import pkg from "connect-redis";
const connectRedis = pkg;

dotenv.config();

const app = express();

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Redis store
const RedisStore = connectRedis(session);
const redisClient = new Redis(process.env.REDIS_URL);

// Session configuration
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

// CORS setup
app.use(
  cors({
    origin: ["http://localhost:3000", "https://swadhyay.onrender.com"],
    credentials: true,
  })
);

// Body parser
app.use(bodyParser.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/payment", ensureAuthenticated, paymentRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/availability", availabilityRoutes);

// Serve Vite build (client/dist) in production
app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
