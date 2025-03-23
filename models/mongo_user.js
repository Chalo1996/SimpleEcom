import mongoose from "mongoose";
import Order from "./order_items.js";

const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: String,
  resetTokenExpirationDate: Date,
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
});

userSchema.methods.addToCart = function (product) {
  const cartProductIndex = this.cart.items.findIndex((cp) => {
    return cp.productId.toString() === product._id.toString();
  });

  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    // Product already exists in the cart, update its quantity
    updatedCartItems[cartProductIndex].quantity += 1;
  } else {
    // Product does not exist in the cart, add it
    updatedCartItems.push({
      productId: product._id,
      quantity: newQuantity,
    });
  }

  const updatedCart = {
    items: updatedCartItems,
  };

  // Update the user's cart
  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.deleteProductFromCart = function (productId) {
  const updatedCartItems = this.cart.items.filter((item) => {
    return item.productId.toString() !== productId.toString();
  });

  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.addOrder = async function () {
  const orderItems = this.cart.items.map((item) => {
    return {
      productId: item.productId,
      quantity: item.quantity,
    };
  });

  const order = new Order({
    user: {
      id: this._id,
      name: this.name,
      email: this.email,
    },
    items: orderItems,
  });

  try {
    await order.save();
    // Clear the cart after saving the order
    this.cart.items = [];
    return this.save();
  } catch (err) {
    console.error("Error placing order:", err);
    throw err;
  }
};

userSchema.methods.getAllOrders = async function () {
  const _db = mongoose.connection;

  try {
    const orders = await _db
      .collection("orders")
      .find({ "user.id": this._id })
      .toArray();
    return orders;
  } catch (err) {
    console.error("Error fetching orders:", err);
    throw err;
  }
};

export default mongoose.model("User", userSchema);
