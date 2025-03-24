import serverless from "serverless-http";
// Import my app
import app from "../app.js";

export default serverless(app);
