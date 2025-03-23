import express from "express";

const app = express();

app.use("/users", (req, res, next) => {
  res.send("<h1>Users Page</h1>");
});

app.use("/", (req, res, next) => {
  res.send("<h1>Home page</h1>");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
