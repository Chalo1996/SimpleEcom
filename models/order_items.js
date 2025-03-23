import mongoose from "mongoose";

const { Schema } = mongoose;

const orderSchema = new Schema({
  user: {
    id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
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
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    // Example field to track the status of the order
    default: "Pending",
  },
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
