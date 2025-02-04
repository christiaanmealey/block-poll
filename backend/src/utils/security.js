import crypto from "crypto";
import jwt from "jsonwebtoken";

export const generateKeypair = () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048, // Key length
    publicKeyEncoding: {
      type: "spki", // spki is the standard for public keys
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8", // pkcs8 is the standard for private keys
      format: "pem",
    },
  });
  return { publicKey, privateKey };
};

export const generateChallenge = () => {
  return crypto.randomBytes(32).toString("base64url");
};

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "2h" });
};

export const signChallenge = (challenge, privateKey) => {
  try {
    const sign = crypto.createSign("SHA256");
    sign.update(challenge);
    sign.end();

    const signature = sign.sign(privateKey, "base64");
    return signature;
  } catch (error) {
    console.error("Error signing the challenge:", error);
    throw error;
  }
};

export const verifyChallenge = (challenge, publicKey, signedChallenge) => {
  try {
    const isVerified = crypto.verify(
      "SHA256",
      Buffer.from(challenge),
      publicKey,
      Buffer.from(signedChallenge, "base64")
    );
  } catch (error) {
    console.error(error);
  }
};
