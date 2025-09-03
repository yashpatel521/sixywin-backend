// validator.ts
import Joi from "joi";
import expressJoiValidator from "express-joi-validation";

class Validator {
  validate = expressJoiValidator.createValidator({
    passError: true, // 👈 ensures Joi errors go to global error handler
  });

  register = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(6).messages({
      "string.min": "Password must be at least 6 characters long",
      "any.required": "Password is required",
    }),

    referralId: Joi.string().optional().allow(""),
  });

  login = Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  });

  socialLogin = Joi.object({
    googleId: Joi.string().required(),
    avatar: Joi.string().optional(),
    username: Joi.string().required(),
    email: Joi.string().required().email(),
  });
}

const validator = new Validator();
const validate = validator.validate;
export { validate };
export default validator;
