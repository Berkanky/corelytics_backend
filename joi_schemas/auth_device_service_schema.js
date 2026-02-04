const Joi = require("joi");

const auth_device_service_schema = Joi.object({
  device_id: Joi.string().required().messages({
    "any.required": "device_id is required. "
  })
});

module.exports = auth_device_service_schema;