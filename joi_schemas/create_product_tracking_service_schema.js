const Joi = require("joi");

const create_product_tracking_service_schema = Joi.object({
  url: Joi.string().required().messages({
    "any.required": "url is required. "
  }),
  time_range: Joi.string().required().messages({
    "any.required": "time_range is required. "
  })
});

module.exports = create_product_tracking_service_schema;