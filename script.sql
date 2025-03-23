-- Create the products table
CREATE TABLE products (
  id CHAR(36) PRIMARY KEY, -- Using UUID
  title VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  imgUrl TEXT,
  description TEXT
);

-- Create the cart table
CREATE TABLE cart (
  id CHAR(36) PRIMARY KEY, -- Using UUID for cart as well
  total_price DECIMAL(10, 2) DEFAULT 0 -- Stores the total price of items in the cart
);

-- Create the cart_items table (join table)
CREATE TABLE cart_items (
  id CHAR(36) PRIMARY KEY, -- UUID for each cart_item entry
  cart_id CHAR(36), -- Foreign key referencing the cart
  product_id CHAR(36), -- Foreign key referencing the product
  quantity INT DEFAULT 1, -- Number of the same product in the cart
  price DECIMAL(10, 2), -- The price at the time of adding to the cart
  FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE, -- When a cart is deleted, all related items should be deleted
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE -- When a product is deleted, it should also be removed from cart_items
);
