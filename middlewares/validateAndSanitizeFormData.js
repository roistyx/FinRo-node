const { body, validationResult } = require('express-validator');

const validateAndSanitizeFormData = [
  // Validate and sanitize fields
  body('currentFormData.firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .matches(/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/)
    .withMessage(
      'First name must contain only letters, spaces, hyphens, and accents'
    )
    .escape(),
  body('currentFormData.lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .matches(/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/)
    .withMessage(
      'Last name must contain only letters, spaces, hyphens, and accents'
    )
    .escape(),
  body('currentFormData.address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .escape(),
  body('currentFormData.phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 10, max: 10 })
    .withMessage('Phone number must be 10 digits')
    .isNumeric()
    .withMessage('Phone number must contain only numbers')
    .escape(),
  body('currentFormData.dob')
    .trim()
    .notEmpty()
    .withMessage('Date of birth is required')
    .isDate()
    .withMessage('Invalid date format')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDifference = today.getMonth() - birthDate.getMonth();
      if (
        monthDifference < 0 ||
        (monthDifference === 0 &&
          today.getDate() < birthDate.getDate())
      ) {
        return age - 1 >= 18;
      }
      return age >= 18;
    })
    .withMessage('Must be at least 18 years old')
    .toDate(),
  body('currentFormData.email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('currentFormData.consultationMethod')
    .trim()
    .notEmpty()
    .withMessage('Consultation method is required')
    .escape(),
  body('currentFormData.diagnosis')
    .trim()
    .notEmpty()
    .withMessage('Diagnosis is required')
    .escape(),
  body('currentFormData.primaryReason')
    .trim()
    .notEmpty()
    .withMessage('Primary reason is required')
    .escape(),
  body('currentFormData.referringPhysician')
    .trim()
    .notEmpty()
    .withMessage('Referring physician is required')
    .escape(),

  // Handle validation result
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = validateAndSanitizeFormData;
