const moment = require("moment");

function validateIso8601Date(req, res, next) {
  const requestDateInUtcDateTime = req.body.requestDateInUtcDateTime;

  if (!requestDateInUtcDateTime) {
    return res
      .status(400)
      .json({ error: "requestDateInUtcDateTime is required" });
  }

  // Check if the date is in the correct ISO 8601 format
  const isValidDate = moment(
    requestDateInUtcDateTime,
    moment.ISO_8601,
    true
  ).isValid();

  if (!isValidDate) {
    return res.status(400).json({
      error:
        "requestDateInUtcDateTime must be in the format YYYY-MM-DDTHH:mm:ss.sssZ",
    });
  }
  // console.log('validateIso8601Date:', requestDateInUtcDateTime);

  next();
}

module.exports = { validateIso8601Date };
