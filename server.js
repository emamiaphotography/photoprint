const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const UPLOADS = path.join(ROOT, "uploads");
const DATA = path.join(ROOT, "orders.json");
fs.mkdirSync(UPLOADS, { recursive: true });
if (!fs.existsSync(DATA)) fs.writeFileSync(DATA, "[]");

app.use(express.json());
app.use(express.static(path.join(ROOT, "public")));
app.use("/uploads", express.static(UPLOADS));

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOADS),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
    cb(null, `${Date.now()}-${crypto.randomBytes(5).toString("hex")}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024, files: 20 },
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Only image files are allowed"));
    cb(null, true);
  }
});

function readOrders() { return JSON.parse(fs.readFileSync(DATA, "utf8")); }
function writeOrders(items) { fs.writeFileSync(DATA, JSON.stringify(items, null, 2)); }

app.get("/api/health", (_, res) => res.json({ ok: true, app: "PhotoPrint MVP" }));

app.post("/api/orders", upload.array("photos", 20), (req, res) => {
  try {
    const { customerName, phone, notes } = req.body;
    const items = JSON.parse(req.body.items || "[]");
    if (!customerName || !phone || !items.length || !req.files?.length) {
      return res.status(400).json({ error: "Name, phone, photos and print selections are required." });
    }
    const photos = req.files.map((f, i) => ({
      filename: f.filename,
      originalName: f.originalname,
      url: `/uploads/${f.filename}`,
      size: f.size,
      selection: items[i] || items[0]
    }));
    const total = photos.reduce((sum, p) => sum + (Number(p.selection.price) || 0) * (Number(p.selection.quantity) || 1), 0);
    const orders = readOrders();
    const order = {
      id: "PP" + Date.now().toString().slice(-8),
      createdAt: new Date().toISOString(),
      customerName, phone, notes: notes || "",
      photos, total,
      paymentStatus: "UNPAID",
      orderStatus: "NEW"
    };
    orders.unshift(order);
    writeOrders(orders);
    res.json({ ok: true, order });
  } catch (e) { res.status(500).json({ error: "Could not save order." }); }
});

app.get("/api/admin/orders", (req, res) => {
  const key = req.headers["x-admin-key"] || req.query.key;
  if (key !== (process.env.ADMIN_KEY || "change-this-admin-key")) return res.status(401).json({ error: "Unauthorized" });
  res.json(readOrders());
});

app.patch("/api/admin/orders/:id", (req, res) => {
  const key = req.headers["x-admin-key"];
  if (key !== (process.env.ADMIN_KEY || "change-this-admin-key")) return res.status(401).json({ error: "Unauthorized" });
  const allowed = ["UNPAID", "PAID", "REFUNDED"];
  const statuses = ["NEW", "APPROVED", "PRINTING", "COMPLETED", "DELIVERED", "CANCELLED"];
  const orders = readOrders();
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (req.body.paymentStatus && allowed.includes(req.body.paymentStatus)) order.paymentStatus = req.body.paymentStatus;
  if (req.body.orderStatus && statuses.includes(req.body.orderStatus)) order.orderStatus = req.body.orderStatus;
  writeOrders(orders);
  res.json({ ok: true, order });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ error: err.message });
  if (err) return res.status(400).json({ error: err.message || "Upload error" });
  next();
});

app.listen(PORT, () => console.log(`PhotoPrint MVP running at http://localhost:${PORT}`));
