import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { Cart } from "./file_cart.js";

const paths = [process.cwd(), "data", "products.json"];
const filePath = path.join(...paths);

export default class FileProduct {
  constructor(id, title, ImgUrl, price, description) {
    this.id = id ? id : randomUUID();
    this.title = title;
    this.ImgUrl = ImgUrl;
    this.price = price;
    this.description = description;
  }

  save() {
    fs.readFile(filePath, (err, data) => {
      let productsArray = [];

      if (err) {
        if (err.code === "ENOENT") {
          // File does not exist, so initialize an empty array
          productsArray = [];
        } else {
          console.error("Error reading file:", err);
          return;
        }
      } else {
        try {
          productsArray = JSON.parse(data);
        } catch (parseError) {
          console.error("Error parsing data:", parseError);
          return;
        }
      }

      productsArray.push(this);

      fs.writeFile(
        filePath,
        JSON.stringify(productsArray, null, 2),
        (writeErr) => {
          if (writeErr) {
            console.error("Error writing to file:", writeErr);
          }
        }
      );
    });
  }

  static fetchAll() {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          if (err.code === "ENOENT") {
            // File does not exist, resolve with an empty array
            resolve([]);
          } else {
            console.error("Could not read the file:", err);
            reject(err);
          }
        } else {
          try {
            const productsArray = JSON.parse(data);
            resolve(productsArray);
          } catch (parseErr) {
            console.error("Error parsing data:", parseErr);
            reject(parseErr);
          }
        }
      });
    });
  }

  static async findById(id) {
    try {
      const products = await this.fetchAll();
      const product = products.find((product_1) => product_1.id === id);
      return product;
    } catch (error) {
      console.error("Could not find a product with the requested id:", error);
      throw error; // This will propagate the error up the promise chain
    }
  }

  static async updateProduct(id, updatedData) {
    try {
      const products = await this.fetchAll();
      const productIndex = products.findIndex((product) => product.id === id);

      if (productIndex >= 0) {
        const updatedProduct = {
          ...products[productIndex],
          ...updatedData,
        };
        products[productIndex] = updatedProduct;

        await fs.promises.writeFile(
          filePath,
          JSON.stringify(products, null, 2)
        );
        return updatedProduct;
      } else {
        throw new Error("Product not found");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  }

  static async deleteProduct(id) {
    try {
      const products = await this.fetchAll();
      const productIndex = products.findIndex((product) => product.id === id);

      if (productIndex >= 0) {
        const productPrice = products[productIndex].price;
        await Cart.deleteProductFromCart(id, productPrice);
        products.splice(productIndex, 1);
      }

      await fs.promises.writeFile(filePath, JSON.stringify(products, null, 2));

      return products;
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  }
}
