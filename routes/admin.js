import express from "express";

import {
  deleteProduct,
  getAddProduct,
  getEditProduct,
  getProducts,
  postAddProduct,
  postDeleteProduct,
  postEditProduct,
} from "../controllers/admin.js";

const Router = express.Router();

Router.get("/add-product", getAddProduct);
Router.get("/products", getProducts);

Router.post("/add-product", postAddProduct);
Router.get("/edit-product/:productId", getEditProduct);
Router.post("/edit-product", postEditProduct);
Router.post("/delete-product", postDeleteProduct);
Router.delete("/product/:productId", deleteProduct);

export default Router;
