import crypto from "crypto";

const generateChallange = () => {
  return crypto.randomBytes(32).toString("base64url");
};

export default generateChallange;
