const Joi = require("joi");

const createOrderSchema = Joi.object({
  restaurant_id: Joi.string().uuid().required(),
  items: Joi.array()
    .items(
      Joi.object({
        menu_item_id: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(1).required(),
      }).required()
    )
    .min(1)
    .required(),
}).required();

module.exports = { createOrderSchema };

