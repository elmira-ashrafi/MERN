import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { readdirSync } from "fs";
import cookieParser from "cookie-parser";
import csurf from "csurf";
import path from "path";
import mongoose from "mongoose";
import multer from "multer";
import { uploadRoot } from "./config/paths.js";

dotenv.config();

// fail loudly at boot instead of signing tokens with `undefined`
for (const key of ["MONGODB", "JWT_SECRET"]) {
  if (!process.env[key]) {
    console.error(`missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const isProduction = process.env.NODE_ENV === "production";

// run app
const app = express();

// the browser reaches us through the proxy in client/server.js, so the socket address is
// always the proxy's. only a proxy on this machine may be believed about the real client ip.
app.set("trust proxy", "loopback");

//csrf protection
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
  },
});

// db connection
mongoose
  .connect(process.env.MONGODB)
  .then(() => console.log("db connected"))
  .catch((err) => console.log("db connection errored: ", err));

// credentials must be allowed explicitly, every client call sends the auth cookie
const allowedOrigins = (
  process.env.CLIENT_ORIGINS || "http://127.0.0.1:3000,http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// config middlewares
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(csrfProtection);

// only the trees that are meant to be public — provider documents are served by an authenticated route
app.use("/uploads/requests", express.static(path.join(uploadRoot, "requests")));
app.use("/uploads/users", express.static(path.join(uploadRoot, "users")));
app.use('/uploads/proposals', express.static(path.join(uploadRoot, 'proposals')));

const __filePath = fileURLToPath(import.meta.url);
const __dirPath = path.dirname(__filePath);
const Routes = readdirSync(path.join(__dirPath, "routes")).filter((file) =>
  file.endsWith(".js"),
);

for (const file of Routes) {
  const route = await import(`./routes/${file}`);
  app.use("/api", route.default);
}

// anything that fell through every router
app.use((req, res) => {
  res.status(404).json({ ok: false, message: "not found" });
});

/*
 * Single place where a thrown error becomes a response. Without it Express answers with an
 * HTML body, which every `await res.json()` on the client turns into an unrelated parse error.
 */
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "something went wrong";

  if (err.code === "EBADCSRFTOKEN") {
    statusCode = 403;
    message = "invalid csrf token";
  } else if (err.name === "UnauthorizedError") {
    statusCode = 401;
    message = "you are not signed in";
  } else if (err instanceof multer.MulterError) {
    statusCode = 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "one of your files is too large"
        : err.code === "LIMIT_FILE_COUNT"
          ? "too many files"
          : "invalid upload";
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message =
      Object.values(err.errors || {})
        .map((e) => e.message)
        .join(", ") || "invalid data";
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "invalid data";
  } else if (err.code === 11000) {
    statusCode = 400;
    message = "this value is already in use";
  }

  if (statusCode >= 500) {
    console.error(err);
    // never leak internals to a client
    if (isProduction) message = "something went wrong! please try again";
  }

  res.status(statusCode).json({ ok: false, message });
});

//Run App
const port = process.env.PORT || 8000;
app.listen(port, () => console.log("server is running on port " + port));
