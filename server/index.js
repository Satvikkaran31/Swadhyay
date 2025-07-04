import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import pgSession from "connect-pg-simple";
import pkg from "pg"; // For Pool
import path from "path";
import { fileURLToPath } from "url";

// Route imports
import calendarRoutes from "./routes/calendarRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import { ensureAuthenticated } from "./controllers/auth.js";

dotenv.config();

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// PostgreSQL Session Store Setup
const PGStore = pgSession(session);
const { Pool } = pkg;

const pgPool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false, // Render PostgreSQL requires SSL
  },
});

// Session middleware
app.use(
  session({
    store: new PGStore({
      pool: pgPool,
      tableName: "user_sessions", // Optional: customize session table name
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // true on Render
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

// CORS (Allow frontend)
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

// Serve frontend build (from Vite)
app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("/{*any}", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
