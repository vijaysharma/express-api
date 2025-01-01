import express from "express";
import fs from "fs/promises";
import path from "path";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const POSTS_FILE = path.join(__dirname, "data", "posts.json");
const USERS_FILE = path.join(__dirname, "data", "users.json");
const JWT_SECRET = process.env.JWT_SECRET; // Replace this with a secure secret

// Middleware to enable CORS
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API is /test working" });
});
app.get("/api", (req, res) => {
  res.json({ message: "API at / is working" });
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

// Helper function to read posts
async function readPosts() {
  try {
    const data = await fs.readFile(POSTS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading posts:", error);
    return [];
  }
}

// Helper function to write posts
async function writePosts(posts) {
  await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2));
}

// Helper function to read users
async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading users:", error);
    return [];
  }
}

// Helper function to write users
async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

// Register a new user
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const users = await readUsers();
    const existingUser = users.find((user) => user.username === username);

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      username,
      password: hashedPassword,
    };

    users.push(newUser);
    await writeUsers(users);

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Login user
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = await readUsers();
    const user = users.find((user) => user.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { algorithm: "HS256", expiresIn: "1h" });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Failed to login" });
  }
});

// Get all posts (protected)
app.get("/api/posts", authenticateToken, async (req, res) => {
  try {
    const posts = await readPosts();
    res.json(posts);
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

    const posts = await readPosts();
    const newPost = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: new Date().toISOString(),
    };

    posts.push(newPost);
    await writePosts(posts);

    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Delete a post (protected)
app.delete("/api/posts/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const posts = await readPosts();
    const filteredPosts = posts.filter((post) => post.id !== id);

    if (posts.length === filteredPosts.length) {
      return res.status(404).json({ error: "Post not found" });
    }

    await writePosts(filteredPosts);
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
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for Vercel
export default app;
