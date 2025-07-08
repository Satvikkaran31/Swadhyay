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
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});
app.use(
  cors({
    origin: [ "https://swadhyay-pa3f.onrender.com","http://localhost:3000",],
    credentials: true,
  })
);

// Body parser
app.use(bodyParser.json());

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
      secure: process.env.NODE_ENV === "production" ? true : false, // Use secure cookies in production
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "lax" : "false", //false works in dev mode :)
    },
  })
);




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
const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
