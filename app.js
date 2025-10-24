// app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

// Controllers & middleware
const FinRoController = require("./controllers/FinRoController.js");
const csvUploadValidator = require("./middlewares/csvUploadValidator.js");
const { InitDBAtlas } = require("./models/initAtlas.js");

// Schwab OAuth helpers

const app = express();

/* ------------------------- Core middleware ------------------------- */
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || true, // loosen for dev
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning", // for ngrok HTML-bridge POST
    ],
  })
);

// Initialize DB (no-op if already connected)
InitDBAtlas();

/* ------------------------- Your API routes ------------------------- */

app.post(
  "/csv/upload-csv",
  upload.single("file"),
  csvUploadValidator,
  FinRoController.processCsv
);

app.get("/accounts/public-auth", FinRoController.getPublicApiKey);
app.get("/public/quote/:symbol", FinRoController.getPublicQuote);
app.get("/accounts/portfolio/:accountId", FinRoController.getPublicPortfolio);
app.post("/accounts", FinRoController.getAccounts);

app.use(express.static(path.join(__dirname, "public")));

/* ------------------------- Start server ------------------------- */

const port = process.env.API_PORT || 3100;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(
    process.env.NODE_ENV === "production"
      ? "Running in production mode"
      : "Running in development mode"
  );
});
