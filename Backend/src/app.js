const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

const personasRouter = require("./routes/personas");
const chatRouter = require("./routes/chat");

// Routes
app.use("/personas", personasRouter);
app.use("/ask", chatRouter);

app.get("/", (req, res) => {
  res.send("SageSearch API is running");
});

// Start server
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;
