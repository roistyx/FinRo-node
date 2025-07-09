const csv = require("csv-parser");
const streamifier = require("streamifier");

const requiredHeaders = [
  "Equities",
  "Price",
  "Holdings",
  "Cost",
  "1D return",
  "Unrealized return",
];

const csvUploadValidator = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  const results = [];

  const stream = streamifier
    .createReadStream(req.file.buffer)
    .pipe(csv())
    .on("headers", (headers) => {
      const missing = requiredHeaders.filter(
        (header) => !headers.includes(header)
      );
      if (missing.length > 0) {
        stream.destroy();
        return res
          .status(400)
          .json({ message: `Missing required columns: ${missing.join(", ")}` });
      }
    })
    .on("data", (data) => results.push(data))
    .on("end", () => {
      req.parsedCsv = results;
      next();
    })
    .on("error", (err) => {
      console.error(err);
      res.status(500).json({ message: "Error parsing CSV file." });
    });
};

module.exports = csvUploadValidator;
