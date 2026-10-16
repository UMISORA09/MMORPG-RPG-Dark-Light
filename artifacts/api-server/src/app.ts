import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import cookieParser from "cookie-parser";
import connectPgSimple from "connect-pg-simple";
import path from "node:path";
import fs from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool, isPostgres } from "@workspace/db";

const app: Express = express();
app.set("trust proxy", 1);


app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Determine session store (PostgreSQL or In-Memory fallback)
let sessionStore: any;
if (isPostgres && pool) {
  try {
    const PgSession = connectPgSimple(session);
    sessionStore = new PgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    });
  } catch (err) {
    logger.warn("Using MemoryStore for sessions (PostgreSQL session store init failed)");
    sessionStore = new session.MemoryStore();
  }
} else {
  sessionStore = new session.MemoryStore();
}

export const sessionMiddleware = session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "mmorpg-dev-secret-key-beta",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: "auto",
    sameSite: "lax",
  },
});

app.use(sessionMiddleware);

// Mount API routes
app.use("/api", router);

// Mount 2D Pixel Chibi Sprite Pipeline assets and Interactive Sandbox
app.use("/assets/exported", express.static(path.resolve(process.cwd(), "assets/exported")));
app.use("/game-sandbox", express.static(path.resolve(process.cwd(), "game")));

// In production or Docker, serve built static frontend files
const potentialStaticPaths = [
  path.resolve(process.cwd(), "artifacts/mmorpg-game/dist/public"),
  path.resolve(process.cwd(), "dist/public"),
  path.resolve(__dirname, "../../mmorpg-game/dist/public"),
  path.resolve(__dirname, "../public"),
  path.resolve(process.cwd(), "public"),
];

const staticDir = potentialStaticPaths.find((p) => fs.existsSync(p));

if (staticDir) {
  logger.info({ staticDir }, "Serving static frontend assets");
  app.use(express.static(staticDir));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;
