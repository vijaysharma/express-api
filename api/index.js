import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import pkg from "pg";

const { Client } = pkg;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

client.connect().catch((err) => console.error("Connection error", err.stack));

// Middleware to enable CORS
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working" });
});

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello! How are you doing today?" });
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Register a new user
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      console.error("Username and password are required");
      return res.status(400).json({ error: "Username and password are required" });
    }

    const result = await client.query("SELECT * FROM users WHERE username = $1", [username]);
    if (result.rows.length > 0) {
      console.error("User already exists");
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      username,
      password: hashedPassword,
    };

    await client.query("INSERT INTO users(id, username, password) VALUES($1, $2, $3)", [newUser.id, newUser.username, newUser.password]);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Failed to register user:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Login user
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await client.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      console.error("Invalid credentials");
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { algorithm: "HS256", expiresIn: "1h" });
    res.json({ token });
  } catch (error) {
    console.error("Failed to login:", error);
    res.status(500).json({ error: "Failed to login", token });
  }
});

// Get all posts (protected)
app.get("/api/posts", authenticateToken, async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM posts");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve posts" });
  }
});

// Create a new post (protected)
app.post("/api/posts", authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const newPost = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: new Date().toISOString(),
    };

    await client.query("INSERT INTO posts(id, title, content, createdAt) VALUES($1, $2, $3, $4)", [newPost.id, newPost.title, newPost.content, newPost.createdAt]);
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Delete a post (protected)
app.delete("/api/posts/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query("DELETE FROM posts WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for Vercel
export default app;
