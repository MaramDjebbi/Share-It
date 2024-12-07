import express from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js"; // Import auth routes
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = 5000 ;

// Enable CORS for all origins
app.use(cors());
// Configure Server Path name
const __dirname = dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(express.json()); // Parse JSON payloads

// Serve Static Files
app.use(express.static(join(__dirname + "/public")));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/", authRoutes); // Mount authentication routes

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
