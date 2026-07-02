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
import courseRoutes from "./routes/courseRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import articleRoutes from "./routes/articleRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { ensureAuthenticated } from "./controllers/auth.js";
import { handleInquiry, inquiryLimiter } from "./controllers/Inquiry.js";
dotenv.config();

const REQUIRED_ENV = ["SESSION_SECRET", "POSTGRES_URL", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"];
const missingEnv = REQUIRED_ENV.filter(k => !process.env[k]);
if (missingEnv.length) {
  console.error(`FATAL: Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

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
const allowed_origins = [
  "https://swadhyay-pa3f.onrender.com",
  "http://localhost:3000",
  "https://swadhyay.co",
];
app.use(
  cors({
    origin: allowed_origins,
    credentials: true,
  })
);

// Body parser
app.use(bodyParser.json());
app.set('trust proxy', 1);
// Session middleware
app.use(
  session({
    store: new PGStore({
      pool: pgPool,
      tableName: "user_sessions", 
      createTableIfMissing: true, 
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production" ? true : false, 
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", //false works in dev mode :)
    },
  })
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/payment", ensureAuthenticated, paymentRoutes);
app.use("/api/calendar", ensureAuthenticated, calendarRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/users", userRoutes);
app.post("/api/contact-us", inquiryLimiter, handleInquiry)
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