// injectDB injects this connection to the database
const { ObjectId } = require("mongodb");

let finRoCollection;

module.exports = class FinRoDao {
  static async injectDB(connection) {
    if (!connection) return;

    try {
      finRoCollection = await connection.collection("Financials");
      console.log("Connected to MongoDB Financials collection");
    } catch (err) {
      console.log(
        `Unable to establish a collection handle in FinancalsDAO: ${err}`
      );
    }
  }

  static async injectReport(data) {
    if (!finRoCollection) {
      console.log("The collection is not connected.");
      return;
    }

    try {
      const { symbol, data: reports } = data;
      const existingSymbolDocument = await finRoCollection.findOne({
        name: symbol,
      });

      if (!existingSymbolDocument) {
        // If the symbol doesn't exist in the collection, insert a new document
        await finRoCollection.insertOne({ name: symbol, data: reports });
        console.log(`New document for ${symbol} has been created.`);
      } else {
        // If the symbol exists, append the new reports to the 'data' array
        for (const report of reports) {
          if (report.symbol === symbol) {
            await finRoCollection.updateOne(
              { name: symbol },
              { $push: { data: report } }
            );
          }
        }
        console.log(`Reports for ${symbol} have been injected.`);
      }
    } catch (err) {
      console.log(`Failed to inject reports: ${err}`);
    }
  }

  static async findReportBySymbol(symbol) {
    if (!finRoCollection) {
      console.log("The collection is not connected.");
      return null;
    }
    try {
      const report = await finRoCollection.findOne({ symbol: symbol });
      return report;
    } catch (err) {
      console.log(`Error fetching report by symbol: ${err}`);
      return null;
    }
  }

  static async getReportByDateAndSymbol(symbol, date) {
    if (!finRoCollection) {
      console.log("The collection is not connected.");
      return null;
    }

    try {
      return await finRoCollection.findOne({
        symbol: symbol,
        filedDate: date,
      });
    } catch (err) {
      console.log(
        `Failed to retrieve data for symbol ${symbol} and date ${date}: ${err}`
      );
      return null;
    }
  }

  static async updateReport(symbol, date, report) {
    if (!finRoCollection) {
      console.log("The collection is not connected.");
      return;
    }

    try {
      await finRoCollection.updateOne(
        { symbol: symbol, filedDate: date },
        { $set: report }
      );
      console.log(
        `Report for ${symbol} and date ${date} updated successfully.`
      );
    } catch (err) {
      console.log(
        `Failed to update report for symbol ${symbol} and date ${date}: ${err}`
      );
    }
  }
};
