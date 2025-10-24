// services/SchwabService.js
const axios = require("axios");
const { getValidAccessToken } = require("../oauth/schwabAuth");

const BASE = "https://api.schwabapi.com/marketdata/v1";

async function getQuote(symbol) {
  const accessToken = await getValidAccessToken();

  const url = `${BASE}/quotes`;
  const params = {
    symbols: symbol,
    fields: "quote", // omit for all fields; include others as needed
  };

  const { data } = await axios.get(url, {
    params,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // Normalize a little: return the symbol node if present
  // Schwab returns an object keyed by symbol or an array depending on endpoint version.
  const payload = data?.[symbol] || data?.quotes || data;
  return payload;
}

async function getDailyPriceHistory(symbol, periodType = "year", period = 1) {
  const accessToken = await getValidAccessToken();

  const url = `${BASE}/pricehistory`;
  const params = {
    symbol,
    periodType, // 'day' | 'month' | 'year' | 'ytd'
    period, // number of periods
    frequencyType: "daily",
    frequency: 1,
    needExtendedHoursData: false,
    needPreviousClose: false,
  };

  const { data } = await axios.get(url, {
    params,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

module.exports = { getQuote, getDailyPriceHistory };
