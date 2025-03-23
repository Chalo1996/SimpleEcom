import fs from "fs";
import path from "path";

const paths = [process.cwd(), "data", "cart.json"];
const filePath = path.join(...paths);

export class Cart {
  static addProduct(product) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        let cart = { products: [], totalPrice: 0 };

        if (err) {
          if (err.code === "ENOENT") {
            // If the file doesn't exist, proceed with the empty cart
            console.log("Cart file not found, creating a new one.");
          } else {
            console.error("Encountered an error:", err);
            return reject(err);
          }
        } else {
          try {
            cart = JSON.parse(data);
          } catch (parseErr) {
            console.error("Error parsing data:", parseErr);
            return reject(parseErr);
          }
        }

        // Find the existing product in the cart
        const existingProductIndex = cart.products.findIndex(
          (prod) => prod.id === product.id
        );

        let updatedProduct;

        if (existingProductIndex >= 0) {
          // Update the quantity of the existing product
          updatedProduct = {
            ...cart.products[existingProductIndex],
            qty: cart.products[existingProductIndex].qty + 1,
          };
          cart.products[existingProductIndex] = updatedProduct;
        } else {
          // Add the new product to the cart
          updatedProduct = { ...product, qty: 1 };
          cart.products.push(updatedProduct);
        }

        // Update the total price
        cart.totalPrice += +product.price;

        // Save the updated cart to the file
        fs.writeFile(filePath, JSON.stringify(cart, null, 2), (writeErr) => {
          if (writeErr) {
            console.error("Error writing to file:", writeErr);
            return reject(writeErr);
          }
          resolve(cart);
        });
      });
    });
  }

  static fetchAll() {
    return new Promise((resolve, reject) => {
      try {
        fs.readFile(filePath, (err, data) => {
          if (err) {
            if (err === "ENOENT") {
              resolve([]);
            } else {
              console.error("Experienced a problem trying to read file:", err);
              reject(err);
            }
          } else {
            const productsArr = JSON.parse(data);
            resolve(productsArr);
          }
        });
      } catch (err) {
        console.error("Could not fetch products:", err);
        reject(err);
      }
    });
  }

  static async deleteProductFromCart(id, productPrice) {
    const cart = await this.fetchAll();

    const productIndex = cart.products.findIndex(
      (product) => product.id === id
    );

    if (productIndex >= 0) {
      const product = cart.products[productIndex];
      const productQuantity = product.qty || 0;

      cart.totalPrice -= productPrice * productQuantity;

      if (cart.totalPrice < 0) {
        cart.totalPrice = 0;
      }

      cart.products.splice(productIndex, 1);

      fs.promises.writeFile(
        filePath,
        JSON.stringify(cart, null, 2),
        (writeErr) => {
          if (writeErr) {
            console.error(
              "Sorry, I experienced problem persisting products:",
              writeErr
            );
          }
        }
      );
    }
  }
}
