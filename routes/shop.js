import express from "express";
import {
  getProducts,
  getIndex,
  getCart,
  getCheckout,
  getOrders,
  getProduct,
  postCart,
  postDeleteItemFromCart,
  // postOrder,
  getCheckoutSuccess,
  getInvoice,
} from "../controllers/shop.js";

import { Auth } from "../middleware/isAuth.js";

const Router = express.Router();

Router.get("/", getIndex);
Router.get("/products", getProducts);
Router.get("/products/:productId", getProduct);
Router.get("/cart", Auth, getCart);
Router.post("/cart", Auth, postCart);
Router.get("/checkout/success", Auth, getCheckoutSuccess);
Router.get("/checkout/cancel", Auth, getCheckout);
Router.get("/checkout", Auth, getCheckout);
Router.get("/orders", Auth, getOrders);
// Router.post("/create-order", Auth, postOrder);
Router.post("/cart-delete-item/:productId", Auth, postDeleteItemFromCart);
Router.get("/orders/:orderId", Auth, getInvoice);

export default Router;
