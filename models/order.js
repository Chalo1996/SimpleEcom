import sequelize from "../util/database.js";
import { DataTypes } from "sequelize";

const Order = sequelize.define("Order", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
});

export default Order;
