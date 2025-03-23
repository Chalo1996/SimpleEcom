
// export function getProducts(req, res, next) {
//   req.user
//     .getProducts()
//     .then((products) => {
//       res.render("shop/product-list", {
//         products,
//         pageTitle: "Products",
//         path: "/products",
//       });
//     })
//     .catch((err) => {
//       console.log(err);
//     });
// }

// export function getProduct(req, res, next) {
//   const { productId } = req.params;
//   const { id } = req.user;
//   req.user
//     .getProducts({ where: { id: productId, userId: id } })
//     .then(([product]) => {
//       console.log("Retrieved Product:", product);
//       res.render("shop/product-details", {
//         product,
//         pageTitle: product.title,
//         path: "/products",
//       });
//     })
//     .catch((err) =>
//       console.error(`Could not find product with the ${productId} id:`, err)
//     );
// }

// export function getIndex(req, res, next) {
//   req.user
//     .getProducts()
//     .then((products) => {
//       res.render("shop/index", {
//         products,
//         pageTitle: "Shop",
//         path: "/",
//       });
//     })
//     .catch((err) => {
//       console.error(err.stack);
//     });
// }

// export async function getCart(req, res, next) {
//   try {
//     // Fetch the cart for the user
//     const cart = await req.user.getCart();
//     console.log("CART:", cart);

//     if (!cart) {
//       console.error("No cart found for user");
//       return res.redirect("/shop");
//     }

//     // Fetch the products associated with the cart
//     const products = await cart.getProducts();
//     console.log("PRODUCTS--->GET CART", products);

//     if (!products || products.length === 0) {
//       console.log("No products in cart");
//       return res.render("shop/cart", {
//         products: [],
//         totalPrice: 0,
//         pageTitle: "Cart",
//         path: "/cart",
//       });
//     }

//     // Map through products to extract necessary details (including the cartItem relationship)
//     const cartItems = products
//       .map((product) => {
//         const cartItem = product.CartItem;

//         // Make sure cartItem exists
//         if (!cartItem) {
//           console.error(`No cartItem found for product ${product.id}`);
//           return null;
//         }

//         return {
//           id: product.id,
//           title: product.title,
//           price: cartItem.price,
//           quantity: cartItem.quantity,
//         };
//       })
//       .filter((item) => item !== null);

//     // Calculate total price
//     const totalPrice = cartItems.reduce((total, item) => {
//       return total + item.price * item.quantity;
//     }, 0);

//     cart.totalPrice = totalPrice;
//     cart.save();

//     // Render the cart view with the fetched products and total price
//     res.render("shop/cart", {
//       products: cartItems,
//       totalPrice: totalPrice,
//       pageTitle: "Cart",
//       path: "/cart",
//     });
//   } catch (err) {
//     console.error("Error fetching cart:", err);
//     res.redirect("/cart");
//   }
// }

// export async function postCart(req, res, next) {
//   try {
//     const cart = await req.user.getCart();
//     console.log("User's cart:", cart);
//     const { productId } = req.body;

//     // Find the product with the associated cartItem
//     const productsInCart = await cart.getProducts({
//       where: { id: productId },
//     });

//     const product = productsInCart.length > 0 ? productsInCart[0] : null;
//     console.log("PRODUCT TO UPDATE:", product);

//     if (product) {
//       // If product already exists in the cart, update the quantity and price
//       const cartItem = product.CartItem;
//       console.log("CART<---->ITEM", cartItem);
//       if (cartItem) {
//         cartItem.quantity += 1;
//         // cartItem.price = cartItem.price * cartItem.quantity;
//         await cartItem.save(); // Save the updated cartItem
//         console.log("Product quantity updated");
//       } else {
//         console.error("CartItem not found for the product");
//       }
//     } else {
//       // If product doesn't exist in the cart, add it
//       const newProduct = await Product.findByPk(productId);
//       if (newProduct) {
//         // Add product to the cart with initial quantity and price
//         await cart.addProduct(newProduct, {
//           through: { quantity: 1, price: newProduct.price },
//         });
//         console.log("Product added to cart");
//       } else {
//         console.error("Product not found in database");
//       }
//     }

//     res.redirect("/cart");
//   } catch (err) {
//     console.error("Error adding product to cart:", err);
//     res.redirect("/cart");
//   }
// }

// export function postDeleteItemFromCart(req, res, next) {
//   const { productId } = req.body;

//   req.user
//     .getCart()
//     .then((cart) => {
//       return cart.getProducts({ where: { id: productId } });
//     })
//     .then((products) => {
//       const product = products[0];
//       if (product) {
//         return product.CartItem.destroy();
//       } else {
//         console.error("Product not found in cart");
//       }
//     })
//     .then(() => {
//       res.redirect("/cart");
//     })
//     .catch((err) => console.error("Error removing product from cart:", err));
// }

// export async function postOrder(req, res, next) {
//   const cart = await req.user.getCart();
//   const products = await cart.getProducts();

//   req.user
//     .createOrder()
//     .then((order) => {
//       return order.addProduct(
//         products.map((product) => {
//           product.OrderItem = { quantity: product.CartItem.quantity };

//           return product;
//         })
//       );
//     })
//     .then(() => {
//       return cart.setProducts(null);
//     })
//     .then(() => res.redirect("/orders"))
//     .catch((err) => console.error("Could not create an order", err));
// }

// export async function getOrders(req, res, next) {
//   const orders = await req.user.getOrders({ include: ["Products"] });
//   console.log("<<<--->>> ORDERS", orders);
//   res.render("shop/orders", {
//     orders,
//     pageTitle: "Orders",
//     path: "/orders",
//   });
// }

// export async function getCheckout(req, res, next) {
//   res.render("shop/checkout", {
//     pageTitle: "Checkout",
//     path: "/checkout",
//   });
// }

import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import Product from "../models/mongo_product.js";
import Order from "../models/order_items.js";
import Stripe from "stripe";
import { config } from "dotenv";

config()

const ITEMS_PER_PAGE = 3;

export function getProducts(req, res, next) {
  const page = +req.query.page || 1;

  let totalItems;

  Product.find()
    .countDocuments()
    .then((count) => {
      totalItems = count;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product-list", {
        products,
        pageTitle: "Products",
        path: "/products",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

export function getProduct(req, res, next) {
  const { productId } = req.params;
  Product.findById(productId)
    .then((product) => {
      console.log("Retrieved Product:", product);
      res.render("shop/product-details", {
        product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

export function getIndex(req, res, next) {
  const page = +req.query.page || 1;

  let totalItems;

  Product.find()
    .countDocuments()
    .then((count) => {
      totalItems = count;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/index", {
        products,
        pageTitle: "Shop",
        path: "/",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

export async function getCart(req, res, next) {
  try {
    const { user } = req;

    console.log("USER--->", user);

    // Fetch the user's cart
    const products = await user.populate("cart.items.productId");
    console.log("POPULATED PRODUCTS", products);
    console.log("POPULATED CART", products.cart.items);

    const populatedProds = products.cart.items;

    // Calculate the total price
    const totalPrice = populatedProds.reduce((total, product) => {
      return total + parseFloat(product.productId.price) * product.quantity;
    }, 0);

    // Render the cart view with the fetched products and total price
    res.render("shop/cart", {
      products: populatedProds,
      totalPrice,
      pageTitle: "Cart",
      path: "/cart",
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
}

export async function postCart(req, res, next) {
  try {
    const { productId } = req.body;
    const { user } = req;
    const product = await Product.findById(productId);
    user.addToCart(product).then(() => {
      res.redirect("/cart");
    });
  } catch (err) {
    console.error("Error adding product to cart:", err);
    res.redirect("/cart");
  }
}

export function postDeleteItemFromCart(req, res, next) {
  const { productId } = req.body;
  const { user } = req;

  user.deleteProductFromCart(productId).then(() => {
    res.redirect("/cart");
  });
}

export async function postOrder(req, res, next) {
  const { user } = req;

  user
    .addOrder()
    .then(() => res.redirect("/orders"))
    .catch((err) => console.error("Could not create an order", err));
}

export async function getCheckoutSuccess(req, res, next) {
  const { user } = req;

  user
    .addOrder()
    .then(() => res.redirect("/orders"))
    .catch((err) => console.error("Could not create an order", err));
}

export async function getOrders(req, res, next) {
  const { user } = req;

  try {
    // Fetch all orders associated with the user by querying the Order collection
    const orders = await Order.find({ "user.id": user._id });

    // Process each order to populate the products
    const myOrders = await Promise.all(
      orders.map(async (order) => {
        // Map through the items in the order to get the products
        const populatedItems = await Promise.all(
          order.items.map(async (item) => {
            const product = await Product.findById(item.productId);
            return {
              productId: item.productId,
              title: product ? product.title : "Unknown Product",
              price: product ? product.price : 0,
              quantity: item.quantity,
            };
          })
        );

        // Return a new structure for each order
        return {
          orderId: order._id,
          items: populatedItems,
          date: order.date,
        };
      })
    );

    console.log("Orders", myOrders);

    // Render the orders page with the processed myOrders data
    res.render("shop/orders", {
      orders: myOrders,
      pageTitle: "Your Orders",
      path: "/orders",
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
}

// Get the invoice for every order - downloadable
export async function getInvoice(req, res, next) {
  const { orderId } = req.params;
  const invoiceName = `invoice-${orderId}.pdf`;
  const invoicePath = path.join("data", "invoices", invoiceName);

  try {
    const order = await Order.findById(orderId).populate("items.productId");

    console.log("ORDER-", order);

    if (!order) {
      return next(new Error("No order found"));
    }

    if (order.user.id.toString() !== req.user._id.toString()) {
      return next(new Error("Unauthorized"));
    }

    console.log("Invoice path-", invoicePath);

    // Check if the invoice already exists
    fs.access(invoicePath, fs.constants.F_OK, (err) => {
      if (err) {
        // If the file doesn't exist, generate the invoice PDF
        const pdfDoc = new PDFDocument();

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${invoiceName}.pdf"`
        );

        // Stream the PDF document to the client and also save it to the file system
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);

        // Customize the invoice PDF
        pdfDoc.fontSize(26).text("Invoice", { underline: true });
        pdfDoc.text(`Order ID: ${orderId}`);
        pdfDoc.text("-----------------------");

        // Dynamically fetch product details
        let totalPrice = 0;
        order.items.forEach((item) => {
          const product = item.productId;
          const productPrice = product ? product.price : 0;
          const productTitle = product ? product.title : "Unknown Product";

          pdfDoc
            .fontSize(14)
            .text(`${productTitle} - ${item.quantity} x $${productPrice}`);

          totalPrice += productPrice * item.quantity;
        });

        pdfDoc.text("-----------------------");
        pdfDoc.fontSize(20).text(`Total Price: $${totalPrice}`);

        pdfDoc.fontSize(14).text("Thank you for your purchase!");

        // Finalize the PDF and send it
        pdfDoc.end();
      } else {
        // If file exists, stream it directly
        const file = fs.createReadStream(invoicePath);
        const stat = fs.statSync(invoicePath);

        res.setHeader("Content-Length", stat.size);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${invoiceName}"`
        );

        file.pipe(res);
      }
    });
  } catch (err) {
    next(err);
  }
}

// Get Checkout
export async function getCheckout(req, res, next) {
  const stripe = Stripe(process.env.STRIPE_KEY);

  let products;
  let total = 0;

  try {
    const user = await req.user.populate("cart.items.productId");

    products = user.cart.items;

    products.forEach((product) => {
      if (product.productId) {
        total += product.quantity * product.productId.price;
      }
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: products.map((product) => {
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.productId.title,
              description: product.productId.description,
            },
            unit_amount: product.productId.price * 100, // Stripe expects amounts in cents
          },
          quantity: product.quantity,
        };
      }),
      mode: "payment",
      success_url: req.protocol + "://" + req.get("host") + "/checkout/success",
      cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel",
    });

    res.render("shop/checkout", {
      pageTitle: "Checkout",
      path: "/checkout",
      products,
      total,
      sessionId: session.id,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    const error = new Error("Failed to load checkout page");
    error.httpStatusCode = 500;
    next(error);
  }
}
