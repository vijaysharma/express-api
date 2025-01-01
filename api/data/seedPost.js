import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const posts = [
  {
    id: "1703862400000",
    title: "Getting Started with Node.js",
    content:
      "Node.js is a powerful runtime that allows you to run JavaScript on the server. It's perfect for building fast, scalable network applications. In this post, we'll explore the basics of Node.js and how to create your first server.",
    createdAt: "2024-12-29T10:00:00.000Z",
  },
  {
    id: "1703866000000",
    title: "Understanding Express Middleware",
    content:
      "Middleware functions are the backbone of Express.js applications. They have access to the request object, response object, and the next middleware function in the application's request-response cycle. This post will teach you everything you need to know about middleware.",
    createdAt: "2024-12-29T11:00:00.000Z",
  },
  {
    id: "1703869600000",
    title: "REST API Best Practices",
    content:
      "Creating a well-designed REST API is crucial for modern web applications. Follow these key principles: use proper HTTP methods, maintain statelessness, use proper status codes, and version your APIs. We'll dive deep into each of these concepts.",
    createdAt: "2024-12-29T12:00:00.000Z",
  },
  {
    id: "1703873200000",
    title: "JavaScript Async/Await Tutorial",
    content:
      "Async/await is a powerful way to handle asynchronous operations in JavaScript. It makes asynchronous code look and behave more like synchronous code, which makes it easier to understand and maintain. Let's explore how to use these features effectively.",
    createdAt: "2024-12-29T13:00:00.000Z",
  },
  {
    id: "1703876800000",
    title: "Web Security Fundamentals",
    content:
      "Security should never be an afterthought in web development. This post covers essential security practices including XSS prevention, CSRF protection, secure headers, and proper authentication methods. Learn how to protect your web applications from common vulnerabilities.",
    createdAt: "2024-12-29T14:00:00.000Z",
  },
];

client
  .connect()
  .then(() => {
    console.log("Connected to the database");
    const query = `
      INSERT INTO posts (id, title, content, createdAt)
      VALUES ($1, $2, $3, $4)
    `;
    posts.forEach(async (post) => {
      try {
        await client.query(query, [post.id, post.title, post.content, post.createdAt]);
        console.log(`Inserted post: ${post.title}`);
      } catch (error) {
        console.error(`Error inserting post: ${post.title}`, error);
      }
    });
  })
  .catch((err) => console.error("Connection error", err.stack))
  .finally(() => client.end());
