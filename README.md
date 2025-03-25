# E-Commerce Site

A simple e-commerce site built with Node.js, Express, Stripe, MongoDB, and more. This project demonstrates user authentication, secure session management with CSRF protection, file uploads via Multer, storage on AWS S3, and a dynamic view layer with EJS.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technologies](#technologies)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Usage](#usage)
- [License](#license)

## Overview

This project is a simple e-commerce website that allows users to browse products, manage their shopping cart, and complete purchases using Stripe for payment processing. It utilizes sessions for user authentication, CSRF protection for enhanced security, and integrates AWS S3 for storing product images or other files.

## Features

- **User Registration and Login:** Secure session management with express-session.
- **File Uploads:** Handle file uploads with Multer and store them on AWS S3.
- **CSRF Protection:** Secure your forms using csurf middleware.
- **Server-Side Rendering:** Dynamic views using EJS.
- **Payment Processing:** Integration with Stripe.
- **Database:** MongoDB for storing user and product data.
- **Error Handling:** Robust error handling and logging.

## Technologies

- **Node.js & Express:** Server-side application framework.
- **MongoDB:** Database storage (hosted on Atlas).
- **EJS:** Templating engine for rendering views.
- **Stripe:** Payment processing integration.
- **Session Management & CSRF:** Secure sessions via express-session and csurf.
- **AWS S3:** File storage solution.
- **Multer:** Middleware for handling file uploads.

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Chalo1996/SimpleEcom.git
   cd SimpleEcom
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a .env file in the root directory with the following keys:

   ```json
   MONGO_URI=your_mongodb_connection_string
   COOKIE_SIGN=your_cookie_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_secret_access_key
   CLOUDINARY_API_SECRET=your_cloudinary_API_Secret
   NODE_ENV=your_node_environment
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLIC_KEY=your_stripe_public_key
   ```

### Environment Variables Explanation

- `MONGO_URI`: MongoDB connection string.
- `COOKIE_SIGN`: Secret key for signing session cookies.
- `CLOUDINARY_CLOUD_NAME`: Cloudinary name.
- `CLOUDINARY_API_KEY`: Cloudinary key.
- `CLOUDINARY_API_SECRET`: The Cloudinary API Key.
- `NODE_ENV`: Environment under which the app is run e.g `Production`.
- `STRIPE_SECRET_KEY`: Your Stripe secret key.
- `STRIPE_PUBLIC_KEY`: Your Stripe public key.

## Running Locally

1. **Start the server:**

   ```bash
   npm start
   ```

2. **Open your browser:**

   Visit: <http://localhost:3000> to see the application in action.

## Deployment

This project can be deployed on various platforms like Vercel, Heroku, or a traditional server. Here's how to deploy on Vercel:

1.  **Set up a Vercel account:**

    If you don't have one, sign up at [Vercel](https://vercel.com/).

2.  **Install the Vercel CLI:**

    ```bash
    npm install -g vercel
    ```

3.  **Deploy:**

    ```bash
    vercel
    ```

    Vercel will guide you through the deployment process. Make sure to link your project to your Vercel account and specify the environment variables in the Vercel dashboard.

    The `vercel.json` file ensures that all necessary files (views, images, etc.) are bundled with your deployment.

### Alternative Deployment (e.g., Heroku)

1.  **Create a Heroku account** and install the Heroku CLI.

2.  **Create a new Heroku app:**

    ```bash
    heroku create
    ```

3.  **Set environment variables:**

    ```bash
    heroku config:set MONGO_URI=your_mongodb_connection_string
    heroku config:set COOKIE_SIGN=your_cookie_secret
    heroku config:set CLOUDINARY_CLOUD_NAME=Cloudinary name.
    heroku config:set CLOUDINARY_API_KEY=Cloudinary key.
    heroku config:set CLOUDINARY_API_SECRET=The Cloudinary API Key.
    heroku config:set NODE_ENV=Environment under which the app is run e.g `Production`.
    heroku config:set STRIPE_SECRET_KEY=your_stripe_secret_key
    heroku config:set STRIPE_PUBLIC_KEY=your_stripe_public_key
    ```

4.  **Deploy the application:**

    ```bash
    git push heroku main
    ```

## Usage

### File Uploads:

Files uploaded via forms (e.g., product images) are handled by Multer and stored temporarily in memory (using Multer's memory storage). They are then uploaded to Cloudinary, and the returned URL is used to display the image on the site.

### Stripe Integration:

The checkout process integrates with Stripe to handle payments securely. Update your Stripe keys in the environment variables to switch between test and live modes.

### Session and CSRF Protection:

User sessions are managed securely with express-session and further protected with csrf-csrf to mitigate CSRF attacks.

## License

This project is licensed under the MIT License. See the [LICENSE](https://opensource.org/license/mit) file for details.
