require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const holdingRoutes = require("./routes/holdingRoutes");
const marketRoutes = require("./routes/marketRoutes");
const depositRoutes = require("./routes/depositRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/holdings", holdingRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/deposits", depositRoutes);

if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "..", "client", "dist");
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.name === "ValidationError" ? 400 : err.status || 500;
  res.status(status).json({ message: err.message || "서버 오류가 발생했습니다." });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
