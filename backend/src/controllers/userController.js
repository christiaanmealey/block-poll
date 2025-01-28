import expressAsycHandler from "express-async-handler";
import generateChallange from "../utils/challenge.js";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

//add to dynamo later
let users = {};

export const getUsers = expressAsycHandler(async (req, res) => {
  try {
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json(error);
  }
});

export const registerUser = expressAsycHandler(async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "User email required" });
    }

    const challenge = generateChallange();
    const userId = uuidv4();

    users[email] = { challenge, userId };

    res.json({
      userId,
      challenge,
      rp: { name: "Blockchain voting app" },
      user: { id: Buffer.from(userId).toString("base64url") },
      name: email,
      displayName: email,
      pubKeyCredParams: [{ alg: -7, type: "public-key" }],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "preferred",
      },
      timeout: 60000,
      attestation: "direct",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

export const updateUser = expressAsycHandler(async (req, res) => {
  try {
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

export const deleteUser = expressAsycHandler(async (req, res) => {
  try {
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

export const authUser = expressAsycHandler(async (req, res) => {
  try {
    const { email, credential } = req.body;
    console.log(req.body);
    if (!email || !credential) {
      res.status(400).json({ error: "Invalid request" });
    }
    const user = users[email];

    if (!user) {
      res.status(404).json({ error: "no user found" });
    }
    const challenge = generateChallange();
    user.challenge = challenge;

    res.status(200).json({ challenge });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

export const verifyUser = expressAsycHandler(async (req, res) => {
  try {
    const { email, credential } = req.body;

    if (!email || !credential) {
      res.status(400).json({ error: "Invalid request" });
    }
    const user = users[email];

    if (!user) {
      res.status(404).json({ error: "no user found" });
    }

    const token = jwt.sign(
      { userId: user.userId, email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ message: "Authenticated", token });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});
