// Using sequelize and MySQL db

// // import Product from "../models/db_product.js";

// // Render the Add Product page
// export function getAddProduct(req, res, next) {
//   res.render("admin/edit-product", {
//     pageTitle: "Add Product",
//     path: "/admin/add-product",
//     editing: false,
//   });
// }

// // Add a new product
// export function postAddProduct(req, res, next) {
//   const { title, imageUrl, price, description } = req.body;

//   req.session
//     .createProduct({
//       title,
//       price,
//       imageUrl,
//       description,
//     })
//     .then((result) => {
//       console.log("Created a product successfully:", result.dataValues);
//       res.redirect("/admin/products");
//     })
//     .catch((error) => {
//       console.error("Error creating product:", error);
//     });
// }

// // Render the Edit Product page
// export function getEditProduct(req, res, next) {
//   const editMode = req.query.edit;
//   if (!editMode) {
//     return res.redirect("/");
//   }
//   const productId = req.params.productId;
//   req.session
//     .getProducts({ where: { id: productId } })
//     .then(([product]) => {
//       if (!product) {
//         return res.redirect("/");
//       }
//       res.render("admin/edit-product", {
//         product: product,
//         pageTitle: "Edit Product",
//         path: "/admin/edit-product",
//         editing: editMode,
//       });
//     })
//     .catch((err) =>
//       console.error("Could not find a product with the id:", err)
//     );
// }

// // Update an existing product
// export function postEditProduct(req, res, next) {
//   const { productId, title, imageUrl, price, description } = req.body;
//   const { id } = req.session;

//   Product.update(
//     {
//       title,
//       imageUrl,
//       price,
//       description,
//     },
//     { where: { id: productId, userId: id } }
//   )
//     .then(() => {
//       console.log("Product updated successfully");
//       res.redirect("/admin/products");
//     })
//     .catch((err) => {
//       console.error("Could not update the product:", err);
//     });
// }

// // Delete a product
// export function postDeleteProduct(req, res, next) {
//   const { productId } = req.body;
//   const { id } = req.session;

//   Product.destroy({ where: { id: productId, userId: id } })
//     .then(() => {
//       console.log("Product deleted successfully");
//       res.redirect("/admin/products");
//     })
//     .catch((err) => {
//       console.error("Could not delete product:", err);
//     });
// }

// // Get all products and render them
// export function getProducts(req, res, next) {
//   req.session
//     .getProducts()
//     .then((products) => {
//       res.render("admin/products", {
//         products: products,
//         pageTitle: "Admin Products",
//         path: "/admin/products",
//       });
//     })
//     .catch((err) => console.log(err));
// }

import Product from "../models/mongo_product.js";
import deleteFile from "../util/file.js";

const ITEMS_PER_PAGE = 3;

// Render the Add Product page
export function getAddProduct(req, res, next) {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    product: {
      title: "",
      price: "",
      description: "",
      imageUrl: "",
    },
    errorMessage: null,
  });
}

// Add a new product using a Cloudinary image URL from the client
export async function postAddProduct(req, res, next) {
  try {
    const { title, price, description, imageUrl } = req.body;

    // Enhanced validation
    const validationErrors = [];
    if (!title) validationErrors.push("Title is required");
    if (!price || price <= 0) validationErrors.push("Valid price is required");
    if (!imageUrl?.startsWith("https://res.cloudinary.com")) {
      validationErrors.push("Valid image URL is required");
    }

    if (validationErrors.length > 0) {
      return res.status(422).render("admin/edit-product", {
        pageTitle: "Add Product",
        path: "/admin/add-product",
        editing: false,
        product: { title, price, description, imageUrl },
        errorMessage: validationErrors.join(". "),
      });
    }

    const product = new Product({
      title: title.trim(),
      price: parseFloat(price).toFixed(2),
      imageUrl,
      description: description.trim(),
      userId: req.user._id,
    });

    await product.save();
    res.redirect("/admin/products");
  } catch (err) {
    console.error("Product save error:", err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
}

// Get all products and render them
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
      res.render("admin/products", {
        products: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
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

// Render the Edit Product page
export async function getEditProduct(req, res, next) {
  const editMode = req.query.edit;
  const errorMessage = req.session.errorMessage;
  req.session.errorMessage = null;
  if (!editMode) {
    return res.redirect("/");
  }

  const productId = req.params.productId;

  try {
    // Find the product by its ID using the Product model
    const product = await Product.findById(productId);
    if (!product) {
      return res.redirect("/");
    }

    res.render("admin/edit-product", {
      product: product,
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: editMode,
      errorMessage,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
}

// Update an existing product; if a new imageUrl is provided, delete the old image on Cloudinary
export async function postEditProduct(req, res, next) {
  const { productId, title, price, description, imageUrl } = req.body;
  // With direct Cloudinary uploads, there's no req.file

  try {
    const product = await Product.findById(productId);
    if (!product) {
      console.log("Product not found");
      return res.status(404).send("Product not found");
    }
    if (product.userId.toString() !== req.user._id.toString()) {
      console.log("Unauthorized attempt to edit product");
      return res.status(403).send("Unauthorized");
    }

    // Update product details
    product.title = title;
    product.price = price;
    product.description = description;

    // If a new imageUrl is provided, delete the old image and update the URL
    if (imageUrl) {
      // Optionally delete the old image from Cloudinary
      await deleteFile(product.imageUrl);
      product.imageUrl = imageUrl;
    }

    await product.save();
    console.log("Product updated successfully");
    res.redirect("/admin/products");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
}

// Delete a product via form submission
export function postDeleteProduct(req, res, next) {
  const { productId } = req.body;

  // Find the product by ID first to check ownership
  Product.findById(productId)
    .then((product) => {
      if (!product) {
        console.log("Product not found");
        return res.status(404).send("Product not found");
      }

      // Check if the current user is the owner of the product
      if (product.userId.toString() !== req.user._id.toString()) {
        console.log("Unauthorized attempt to delete product");
        return res.status(403).send("Unauthorized");
      }

      console.log("Product--->", product);

      // Delete the image from Cloudinary using deleteFile
      deleteFile(product.imageUrl);

      // Delete the product from the database
      return Product.deleteOne({ _id: productId });
    })
    .then(() => {
      console.log("Product deleted successfully");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

// Delete a product via AJAX request
export function deleteProduct(req, res, next) {
  const { productId } = req.params;

  // Find the product by ID first to check ownership
  Product.findById(productId)
    .then((product) => {
      if (!product) {
        console.log("Product not found");
        return res.status(404).send("Product not found");
      }

      // Check if the current user is the owner of the product
      if (product.userId.toString() !== req.user._id.toString()) {
        console.log("Unauthorized attempt to delete product");
        return res.status(403).send("Unauthorized");
      }

      console.log("Product--->", product);

      // Delete the image from Cloudinary
      deleteFile(product.imageUrl);

      // Delete the product from the database
      return Product.deleteOne({ _id: productId });
    })
    .then(() => {
      console.log("Product deleted successfully");
      res.status(200).json({ message: "Product deleted successfully" });
    })
    .catch((err) => {
      res.status(500).json({ message: "Failed to delete product" });
    });
}
