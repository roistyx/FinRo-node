require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const FinRoController = require("./controllers/FinRoController.js");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const csvUploadValidator = require("./middlewares/csvUploadValidator.js");

const { InitDBAtlas } = require("./models/initAtlas.js");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

InitDBAtlas();

app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.static("public"));

app.post(
  "/csv/upload-csv",
  upload.single("file"),
  csvUploadValidator,
  FinRoController.processCsv
);
app.post("/accounts", FinRoController.getAccounts);

const port = process.env.API_PORT;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

if (process.env.NODE_ENV === "production") {
  console.log("Running in production mode");
} else {
  console.log("Running in development mode");
}
