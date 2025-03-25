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
import uploadRouter from "./upload.js";
import { configureCloudinary } from "../util/cloudinaryService.js";
import dotenv from "dotenv";

dotenv.config();

// Initialize Cloudinary once
configureCloudinary();

const Router = express.Router();

Router.use(uploadRouter);

// Existing routes
Router.get("/add-product", getAddProduct);
Router.get("/products", getProducts);
Router.post("/add-product", postAddProduct); // No multer here anymore
Router.get("/edit-product/:productId", getEditProduct);
Router.post("/edit-product", postEditProduct);
Router.post("/delete-product", postDeleteProduct);
Router.delete("/product/:productId", deleteProduct);

export default Router;
