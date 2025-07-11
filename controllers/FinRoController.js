require("dotenv").config();

class FinRoController {
  static async processCsv(req, res) {
    if (!req.parsedCsv) {
      return res.status(400).json({ message: "No parsed CSV data found." });
    }

    const results = req.parsedCsv.map((row) => {
      // Split Holdings
      const holdingsMatch = row["Holdings"]?.match(/\$([\d,\.]+)\s*([\d\.]+)/);
      const Holdings = holdingsMatch
        ? parseFloat(holdingsMatch[1].replace(/,/g, ""))
        : null;
      const Quantity = holdingsMatch ? parseFloat(holdingsMatch[2]) : null;

      // Split Cost
      const costMatch = row["Cost"]?.match(/\$?([\d,\.]+)\s*\$?([\d\.]+)/);
      const Total_Cost = costMatch
        ? parseFloat(costMatch[1].replace(/,/g, ""))
        : null;
      const Cost_per_share = costMatch ? parseFloat(costMatch[2]) : null;

      // Split Unrealized Return
      const unrealizedMatch = row["Unrealized return"]?.match(
        /([\d\.]+)%\s*\+?\s*\$?([\d,\.]+)/
      );
      const Unrealized_return_percent = unrealizedMatch
        ? parseFloat(unrealizedMatch[1])
        : null;
      const Unrealized_return_dollars = unrealizedMatch
        ? parseFloat(unrealizedMatch[2].replace(/,/g, ""))
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

    res.json({ message: "Processed CSV successfully", data: results });
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
}

module.exports = FinRoController;
