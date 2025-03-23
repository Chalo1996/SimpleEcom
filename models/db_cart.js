import { DataTypes, UUIDV4 } from "sequelize";
import sequelize from "../util/database.js";

const Cart = sequelize.define("Cart", {
  id: {
    type: DataTypes.UUID,
    defaultValue: UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  // Optional: Track total price of all items in the cart
  totalPrice: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0.0,
  },
  // Optional: Add a status field for cart (e.g. active, completed, etc.)
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "active", // Could be 'active', 'completed', 'abandoned', etc.
  },
});

export default Cart;
