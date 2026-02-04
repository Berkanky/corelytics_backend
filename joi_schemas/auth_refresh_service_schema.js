const Joi = require("joi");

const auth_refresh_service_schema = Joi.object({
  refresh_token: Joi.string().required().messages({
    "any.required": "refresh_token is required. "
  })
});

module.exports = auth_refresh_service_schema;