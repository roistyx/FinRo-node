// dateValidatorMiddleware.js

// This middleware validates and formats the date properties
function dateValidatorMiddleware(req, res, next) {
  const {
    searchQuery,
    startMonth,
    startDate,
    startYear,
    endMonth,
    endDate,
    endYear,
  } = req.body;

  // Function to format date strings as "YYYY-MM-DD"
  function formatDate(year, month, day) {
    return `${year.toString().padStart(4, "0")}-${month
      .toString()
      .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  }

  // Constructing the new object with formatted date strings
  const formattedObj = {
    symbol: searchQuery,
    startDate: formatDate(startYear, startMonth, startDate),
    endDate: formatDate(endYear, endMonth, endDate),
  };

  // Adding the formatted object to the request for further processing in the route handler
  req.formattedObj = formattedObj;

  next();
}

module.exports = dateValidatorMiddleware;
