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
    rejectUnauthorized: false, // Render  SSL
  },
});
app.use(
  cors({
    origin: [ "https://swadhyay-pa3f.onrender.com","http://localhost:3000",],
    credentials: true,
  })
);

// Session middleware
app.use(
  session({
    store: new PGStore({
      pool: pgPool,
      tableName: "user_sessions", 
      createTableIfMissing: true, // Create table if it doesn't exist
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", 
      httpOnly: true,
      sameSite: "none",
    },
  })
);

// CORS (Allow frontend)

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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
