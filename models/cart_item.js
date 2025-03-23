import { DataTypes, UUIDV4 } from "sequelize";
import sequelize from "../util/database.js";

const CartItem = sequelize.define("CartItem", {
  id: {
    type: DataTypes.UUID,
    defaultValue: UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  price: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
});

export default CartItem;
