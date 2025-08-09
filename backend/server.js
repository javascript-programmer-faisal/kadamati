require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const session = require('express-session');
const app = express();

const PORT = process.env.PORT || 5000;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

const upload = multer();

// Schema
const orderSchema = new mongoose.Schema({
  phone: String,
  name: String,
  address: String,
  order_json: String,
  delivery_charge: Number,
  total_amount: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Order = mongoose.model('Order', orderSchema);

// Authentication Middleware
const requireLogin = (req, res, next) => {
  if (req.session && req.session.loggedIn) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Routes
app.get('/login', (req, res) => {
  res.send(`
    <form method="POST" action="/login" style="max-width:400px;margin:50px auto">
      <h2>Admin Login</h2>
      <input name="username" placeholder="Username" style="display:block;width:100%;margin-bottom:10px" />
      <input name="password" type="password" placeholder="Password" style="display:block;width:100%;margin-bottom:10px" />
      <button type="submit">Login</button>
    </form>
  `);
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'Kadamati' && password === 'hwgfdsbyhgedwty1675') {
    req.session.loggedIn = true;
    res.redirect('/admin');
  } else {
    res.send('❌ ভুল username বা password');
  }
});

app.get('/admin', requireLogin, async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  const rows = orders.map(order => `
    <tr>
      <td>${order.name}</td>
      <td>${order.phone}</td>
      <td>${order.address}</td>
      <td>${order.order_json}</td>
      <td>৳${order.delivery_charge}</td>
      <td>৳${order.total_amount}</td>
      <td>${new Date(order.createdAt).toLocaleString()}</td>
    </tr>
  `).join('');

  res.send(`
    <h2 style="text-align:center;margin:20px 0">🧾 অর্ডার লিস্ট</h2>
    <table border="1" cellpadding="10" cellspacing="0" style="width:95%;margin:auto;border-collapse:collapse">
      <thead>
        <tr>
          <th>নাম</th>
          <th>ফোন</th>
          <th>ঠিকানা</th>
          <th>অর্ডার</th>
          <th>ডেলিভারি চার্জ</th>
          <th>মোট টাকা</th>
          <th>তারিখ</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `);
});

// Order Submission
app.post('/submit-order', upload.none(), async (req, res) => {
  try {
    const order = new Order({
      phone: req.body.phone,
      name: req.body.name,
      address: req.body.address,
      order_json: req.body.order_json,
      delivery_charge: req.body.delivery_charge,
      total_amount: req.body.total_amount
    });

    await order.save();
    res.status(200).send("✅ অর্ডার সফলভাবে নেওয়া হয়েছে!");
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).send("❌ সার্ভার সমস্যা হয়েছে!");
  }
});

// Raw API
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "ডেটা আনতে সমস্যা হয়েছে!" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
