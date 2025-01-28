import express from "express";
import { createServer } from "http";
import bodyParser from "body-parser";
import cors from "cors";
import userRoutes from "./routes/users.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.use("/users", userRoutes);

const PORT = process.env.PORT || 5000;
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`app listening on ${PORT}`);
});
