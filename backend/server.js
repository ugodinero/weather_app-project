const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
require("./db");
const User = require("./models/User");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Fill in all the fields." });
        }
        const oldUser = await User.findOne({ email: email });
        if (oldUser) {
            return res.status(400).json({ message: "Email already registered." });
        }
        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ name: name, email: email, password: hashed });
        await user.save();
        res.status(201).json({ message: "Account created." });
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password." });
        }
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            return res.status(400).json({ message: "Invalid email or password." });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.json({ token: token, name: user.name, email: user.email });
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
});

app.get("/user/me", async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const data = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(data.id);
        res.status(200).json({ user: user });
    } catch (err) {
        res.status(401).json({ message: "Not logged in." });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log("server is running on port " + PORT);
});
