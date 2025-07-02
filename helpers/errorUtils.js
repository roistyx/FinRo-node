const { de } = require('date-fns/locale');

const sendErrorResponse = (res, errorCode, message) => {
  console.log(
    'Error logged on helpers/sendErrorResponse:',
    errorCode,
    message
  );

  switch (errorCode) {
    case 200:
      return res.status(200).json({
        success: false,
        warning_message: message,
      });
    case 400:
      return res.status(400).json({
        success: false,
        warning_message: message,
      });

    case 500:
      return res.status(500).json({
        success: false,
        warning_message: message,
      });
    default:
      return res.status(500).json({
        success: false,
      });
  }
};

module.exports = { sendErrorResponse };
