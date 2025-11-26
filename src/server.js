
import express from "express";
import db from "./db/index.js"; // your pool
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;

app.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT NOW() AS now");
    res.json({ serverTime: rows[0].now });
  } catch (err) {
    console.error("Database query failed:", err.message);
    res.status(500).json({ error: "Database error" });
  }
});


app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
