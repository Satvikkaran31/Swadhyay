import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url'; // Required for __dirname in ES modules

import calendarRoutes from "./routes/calendarRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import authRoutes from './routes/authRoutes.js';
import availabilityRoutes from "./routes/availabilityRoutes.js";
import { ensureAuthenticated } from "./controllers/auth.js";

dotenv.config();

const app = express();

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
  }
}));

// CORS
app.use(cors({
  origin: ["http://localhost:3000", "https://swadhyay.onrender.com"],
  credentials: true,
}));

// Body parser
app.use(bodyParser.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use("/api/payment", ensureAuthenticated, paymentRoutes);
app.use("/api", calendarRoutes);
app.use("/api", availabilityRoutes);

// -------------------------------
// Serve frontend (AFTER API ROUTES)
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});
// -------------------------------

// Start server
app.listen(process.env.PORT || 5000, () =>
  console.log("Server running on port", process.env.PORT || 5000)
);
  