import express from "express";
import path from "path";
import cors from 'cors';
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js"; // Import auth routes
import { Server } from "socket.io";


const app = express();
const __dirname = path.resolve();
const PORT = 5000;

// Enable CORS for all origins
app.use(cors());

// Middleware
app.use(express.json()); // Parse JSON payloads

// Middleware to serve static files
app.use(express.static(path.join(__dirname, "public")));

// Serve login.html as the entry point
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/", authRoutes); // Mount authentication routes

// Your existing login and signup routes here...

// Start Express Server
const expServer = app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});


// Initialize Socket.IO
const io = new Server(expServer);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("sender-join", function (data) {
    socket.join(data.uid);
  });

  socket.on("receiver-join", function (data) {
    socket.join(data.uid);
    socket.in(data.sender_uid).emit("init", data.uid);
  });

  socket.on("file-meta", function (data) {
    socket.in(data.uid).emit("fs-meta", data.metadata);
  });

  socket.on("fs-start", function (data) {
    socket.in(data.uid).emit("fs-share", {});
  });

  socket.on("file-raw", function (data) {
    socket.in(data.uid).emit("fs-share", data.buffer);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});