
import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";

import routes from "./routes";
import authRoutes from "./auth";
import { setupSwagger } from "./swagger";

const app = express();

const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing");
}

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // Local HTTP development only
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use("/api/auth", authRoutes);
app.use("/api", routes);

setupSwagger(app);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`42 Horizon running at http://localhost:${PORT}`);
});
