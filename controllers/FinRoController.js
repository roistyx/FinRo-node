require("dotenv").config();
const PDFDocument = require("pdfkit");
const getStream = require("get-stream");
const axios = require("axios");

class FinRoController {
  static async processCsv(req, res) {
    if (!req.parsedCsv) {
      return res.status(400).json({ message: "No parsed CSV data found." });
    }

    const results = req.parsedCsv.map((row) => {
      // Combine all fields into a single string to fix spacing and split issues
      const fullRowStr = Object.values(row)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      // Parse Holdings and Quantity (e.g., "$2 347.60 10 shares")
      const holdingsMatch = fullRowStr.match(
        /\$([\d\s,\.]+)\s+([\d\.]+)\s*shares?/i
      );
      const Holdings = holdingsMatch
        ? parseFloat(holdingsMatch[1].replace(/\s|,/g, ""))
        : null;
      const Quantity = holdingsMatch ? parseFloat(holdingsMatch[2]) : null;

      // Parse Total Cost and Cost per Share (e.g., "$744.91 $1 054.93/share")
      const costMatch = fullRowStr.match(
        /\$([\d\s,\.]+)[^\d]+\$([\d\s,\.]+)\/?share/i
      );
      const Total_Cost = costMatch
        ? parseFloat(costMatch[1].replace(/\s|,/g, ""))
        : null;
      const Cost_per_share = costMatch
        ? parseFloat(costMatch[2].replace(/\s|,/g, ""))
        : null;

      // Parse Unrealized Return (e.g., "+ 38.60% + $653.80")
      const unrealizedMatch = fullRowStr.match(
        /([\d\.]+)%\s*\+?\s*\$([\d\s,\.]+)/
      );
      const Unrealized_return_percent = unrealizedMatch
        ? parseFloat(unrealizedMatch[1])
        : null;
      const Unrealized_return_dollars = unrealizedMatch
        ? parseFloat(unrealizedMatch[2].replace(/\s|,/g, ""))
        : null;

      return {
        Equities: row["Equities"],
        Holdings,
        Quantity,
        Total_Cost,
        Cost_per_share,
        Unrealized_return_percent,
        Unrealized_return_dollars,
      };
    });

    // Sort by Holdings descending
    results.sort((a, b) => (b.Holdings || 0) - (a.Holdings || 0));

    // Generate PDF
    const doc = new PDFDocument();
    doc.fontSize(18).text("CSV Holdings Report", { underline: true });
    doc.moveDown();

    results.forEach((row, i) => {
      doc
        .fontSize(12)
        .text(
          `${i + 1}. ${row.Equities}\n` +
            `   Holdings: $${row.Holdings ?? "N/A"} | Shares: ${
              row.Quantity ?? "N/A"
            }\n` +
            `   Cost: $${row.Total_Cost ?? "N/A"} @ $${
              row.Cost_per_share ?? "N/A"
            }/share\n` +
            `   Return: ${row.Unrealized_return_percent ?? "N/A"}% ($${
              row.Unrealized_return_dollars ?? "N/A"
            })`
        );
      doc.moveDown();
    });

    doc.end();
    const pdfBuffer = await getStream.buffer(doc);
    const pdfBase64 = pdfBuffer.toString("base64");

    res.json({
      message: "Processed CSV successfully",
      data: results,
      pdfBase64,
    });
  }

  static async getAccounts(req, res) {
    console.log("Fetching accounts from environment variable");
    if (!process.env.ACCOUNTS) {
      return res.status(500).json({ message: "No accounts configured." });
    }
    try {
      const accounts = JSON.parse(process.env.ACCOUNTS || "[]");
      res.json(accounts);
    } catch (error) {
      console.error("Failed to parse ACCOUNTS env variable", error);
      res.status(500).json({ message: "Error retrieving accounts." });
    }
  }

  static async getPublicApiKey(req, res) {
    console.log("Fetching access token from Public API...");

    const secret = process.env.PUBLICDOTCOM_SECRET_KEY;

    const validityInMinutes = 123; // you can make this dynamic if needed

    if (!secret) {
      return res
        .status(500)
        .json({ message: "Missing PUBLICDOTCOM_SECRET_KEY in environment." });
    }

    try {
      const response = await axios.post(
        "https://api.public.com/userapiauthservice/personal/access-tokens",
        {
          validityInMinutes,
          secret,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const accessToken =
        response.data.accessToken || response.data.token || response.data;
      return res.json({ accessToken });
    } catch (error) {
      console.error(
        "Failed to retrieve access token:",
        error.response?.data || error.message
      );
      return res.status(500).json({
        message: "Failed to retrieve access token from Public API.",
        error: error.response?.data || error.message,
      });
    }
  }
  static async getPublicPortfolio(req, res) {
    console.log("🔍 Fetching portfolio from Public API...");

    const accountId = req.params.accountId; // or req.query.accountId if using query params
    const accessToken = req.headers["authorization"]?.split(" ")[1]; // assume "Bearer <token>"

    if (!accountId) {
      console.error("❌ Missing accountId.");
      return res.status(400).json({ message: "Missing accountId." });
    }

    if (!accessToken) {
      console.error("❌ Missing access token.");
      return res.status(401).json({ message: "Missing access token." });
    }
    console.log("Received accountId and accessToken:", accountId);
    const url = `https://api.public.com/userapigateway/trading/${accountId}/portfolio/v2`;

    try {
      console.log(`➡️ GET ${url}`);
      console.log(
        `🔐 Using access token: Bearer ${accessToken.slice(0, 10)}...`
      );

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Portfolio response received:", response.data);

      return res.json(response.data);
    } catch (error) {
      console.error(
        "❌ Failed to fetch portfolio:",
        error.response?.data || error.message
      );
      return res.status(500).json({
        message: "Error fetching portfolio from Public API.",
        error: error.response?.data || error.message,
      });
    }
  }
}

module.exports = FinRoController;
