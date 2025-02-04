import expressAsyncHandler from "express-async-handler";
import {
  generateChallenge,
  generateToken,
  generateKeypair,
  verifyChallenge,
} from "../utils/security.js";
import { v4 as uuidv4 } from "uuid";
import {
  createUser,
  getUser,
  updateUser as serviceUpdateUser,
} from "../services/userService.js";
import crypto from "crypto";

//add to dynamo later
let users = {};

export const getUsers = expressAsyncHandler(async (req, res) => {
  try {
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json(error);
  }
});

export const registerUser = expressAsyncHandler(async (req, res) => {
  try {
    const { email, publicKey } = req.body;

    if (!email) {
      res.status(400).json({ message: "User email required" });
    }

    const userId = uuidv4();

    const user = { email, userId, publicKey };
    createUser(user);
    res.json({
      userId,
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

export const updateUser = expressAsyncHandler(async (req, res) => {
  try {
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

export const deleteUser = expressAsyncHandler(async (req, res) => {
  try {
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

export const authUser = expressAsyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Invalid request" });
    }
    const user = await getUser(email);
    if (!user) {
      res.status(404).json({ error: "no user found" });
    }
    const challenge = generateChallenge();
    serviceUpdateUser(user.userId, { challenge });

    res.status(200).json({ challenge });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

export const verifyUser = expressAsyncHandler(async (req, res) => {
  try {
    const { email, signedChallenge } = req.body;

    if (!email || !signedChallenge) {
      res.status(400).json({ error: "Invalid request" });
    }
    //const user = getUser(email);
    //const storedChallenge = user.challenge;
    const user = await getUser(email);

    if (!user) {
      res.status(404).json({ error: "no user found" });
    }
    const verifier = crypto.createVerify("SHA256");
    verifier.update(user.challenge);
    verifier.end();

    const publicKeyPem = convertBase64ToPem(user.publicKey);

    const isValid = verifier.verify(
      publicKeyPem,
      Buffer.from(signedChallenge, "base64")
    );

    if (!isValid) {
      return res.status(401).json({ error: "Not Authorized" });
    }

    const token = generateToken(user.userId);

    res.status(200).json({ message: "Authenticated", token });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

function convertBase64ToPem(base64Key) {
  const pemKey = `-----BEGIN PUBLIC KEY-----\n${base64Key
    .match(/.{1,64}/g)
    .join("\n")}\n-----END PUBLIC KEY-----`;
  return pemKey;
}
