import express from "express";
import path from "path";
import adminRoutes from "./routes/admin.js";
import shopRoutes from "./routes/shop.js";
import authRoutes from "./routes/auth.js";
import { getErrorPage } from "./controllers/error.js";
import User from "./models/mongo_user.js";
import mongoose from "mongoose";
import session from "express-session";
import connectMongoDBSession from "connect-mongodb-session";
import { Auth } from "./middleware/isAuth.js";
import csurf from "csurf";
import { config } from "dotenv";
import multer from "multer";
import fs from "fs";
import bodyParser from "body-parser";

config();

// These imports were used when working with sequelize

// import sequelize from "./util/database.js";
// import Product from "./models/db_product.js";
// import User from "./models/user.js";
// import Cart from "./models/db_cart.js";
// import CartItem from "./models/cart_item.js";
// import Order from "./models/order.js";
// import OrderItem from "./models/order_items.js";

// DATABASE URL
const uri = process.env.MONGO_URI;

const app = express();

const MongoDBStore = connectMongoDBSession(session);
const store = new MongoDBStore({ uri, collection: "sessions" });
const csrfProtection = csurf();
const viewPath = [process.cwd(), "views"];

// File storage configuration for multer
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "images");

    // Ensure that the "images" directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // Save file to "images" folder
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Construct a unique filename with timestamp and original name
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File filter function to limit uploads to certain MIME types (optional)
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    // Accept file
    cb(null, true);
  } else {
    // Reject file
    cb(null, false);
  }
};

app.set("view engine", "ejs");
app.set("views", path.join(...viewPath));

// Use express.urlencoded middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Multer middleware configuration
app.use(
  multer({
    storage: fileStorage,
    fileFilter,
    // Limit file size to 5MB
    limits: { fileSize: 1024 * 1024 * 5 },
  }).single("image")
);

// Serve static files for "public" and "images" directories
app.use(express.static(path.join(process.cwd(), "public")));
app.use("/images/", express.static(path.join(process.cwd(), "images")));

// Session manager
app.use(
  session({
    secret: process.env.COOKIE_SIGN,
    saveUninitialized: false,
    resave: false,
    store,
  })
);

// A middleware to protect against CSRF attacks
app.use(csrfProtection);

// Middleware to make the user available in all requests
app.use((req, res, next) => {
  if (!req.session.user) {
    // If no user in session, proceed without attaching a user to the request
    return next();
  }

  // Fetch the user by email if the session has a user
  User.findOne({ email: req.session.user.email })
    .then((user) => {
      if (user) {
        // Attach the user object to the request if found
        req.user = user;
      } else {
        console.log("User not found");
      }
      next();
    })
    .catch((err) => {
      console.error("Error fetching user:", err);
      next(err);
    });
});

// Pass local variables to views
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();

  next();
});

// Use the admin and shop routes
app.use("/admin", Auth, adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

// 404 error page
app.use(getErrorPage);

// Error Middleware
app.use((error, req, res, next) => {
  res.status(500).render("errors/error-page", {
    pageTitle: "Error",
    path: "/error-page",
    errorMessage: error.message || "Something went wrong!",
  });
});

// Define relationships --> When working with sequelize -> SQL: uncomment
// Product.belongsTo(User, {
//   constraints: true,
//   onDelete: "CASCADE",
// });

// Cart.belongsTo(User, {
//   constraints: true,
//   onDelete: "CASCADE",
// });

// Order.belongsTo(User, {
//   constraints: true,
//   onDelete: "CASCADE",
// });

// Cart.belongsToMany(Product, {
//   through: CartItem,
// });
// Product.belongsToMany(Cart, {
//   through: CartItem,
// });
// Order.belongsToMany(Product, { through: OrderItem });
// Product.belongsToMany(Order, { through: OrderItem });

// User.hasMany(Product);
// User.hasMany(Order);
// User.hasOne(Cart);

// Sync database and create the default user --> When working with sequelize -> SQL: uncomment
// sequelize
//   .sync()
//   .then(() => {
//     return User.findOrCreate({
//       where: { email: "emusyoka759@gmail.com" },
//       defaults: { name: "Emmanuel Chalo", email: "emusyoka759@gmail.com" },
//     });
//   })
//   .then(async ([user, created]) => {
//     if (created) {
//       console.log("New user created:", user.dataValues);
//     } else {
//       console.log("User already exists:", user.dataValues);
//     }

//     // Ensure user has only one cart
//     let cart = await Cart.findOne({ where: { userId: user.id } });
//     if (!cart) {
//       console.log("Creating a new cart for user");
//       cart = await user.createCart();
//     } else {
//       console.log("User already has a cart");
//     }

//     return cart;
//   })
//   .then(() => {
//     // Start the server after user creation and cart check
//     app.listen(3000, () => {
//       console.log("Server listening on port 3000");
//     });
//   })
//   .catch((error) => {
//     console.error("An error occurred syncing with the database", error);
//   });

const connectToDatabase = async () => {
  try {
    // Connect to your MongoDB database
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error connecting to the database or creating user:", err);
  }
};

connectToDatabase()
  .then(() => {
    app.listen(3000, () => {
      console.log("Server listening on port 3000");
    });
  })
  .catch((error) =>
    console.error("Could not establish connect with the server", error)
  );
