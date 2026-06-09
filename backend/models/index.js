const { mongoose } = require("../config/db");
const Plant = require("./Plant");
const { Order, OrderItem } = require("./Order");
const { Estimation, EstimationItem } = require("./Estimation");
const User = require("./User");

module.exports = {
  sequelize: mongoose, // export mongoose client as sequelize for minor compatibility
  mongoose,
  Plant,
  Order,
  OrderItem,
  Estimation,
  EstimationItem,
  User,
};