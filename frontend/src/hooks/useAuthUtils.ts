import { useCallback } from "react";

// Define the shape of encryptedData type
type EncryptedData = {
  iv: string; // Initialization vector (base64 encoded)
  encryptedKey: string; // Encrypted key (base64 encoded)
};

const useAuthUtils = () => {
  // Convert a string to a Uint8Array
  const strToUint8Array = (str: string): Uint8Array => {
    return new TextEncoder().encode(str);
  };

  // Convert a Uint8Array to Base64
  const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
    return btoa(String.fromCharCode(...bytes));
  };

  // Convert a Base64 string to a Uint8Array
  const base64To8Uint8Array = (str: string): Uint8Array => {
    return new Uint8Array([...atob(str)].map((c) => c.charCodeAt(0)));
  };

  // Generate an AES-GCM key
  const generateAESKey = async (): Promise<CryptoKey> => {
    return await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  };

  // Encrypt the private key with AES-GCM
  const encryptPrivateKey = async (
    aesKey: CryptoKey,
    privateKey: string
  ): Promise<EncryptedData> => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      aesKey,
      strToUint8Array(privateKey)
    );

    return {
      iv: uint8ArrayToBase64(iv),
      encryptedKey: uint8ArrayToBase64(new Uint8Array(encryptedData)),
    };
  };

  // Decrypt the private key using AES-GCM
  const decryptPrivateKey = async (
    aesKey: CryptoKey,
    encryptedData: EncryptedData
  ): Promise<string> => {
    const iv = base64To8Uint8Array(encryptedData.iv);
    const encryptedBytes = base64To8Uint8Array(encryptedData.encryptedKey);

    const decryptedData = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      aesKey,
      encryptedBytes
    );

    return new TextDecoder().decode(decryptedData);
  };

  // Save the encrypted private key and AES key to localStorage
  const savePrivateKeyToLocalStorage = async (privateKey: string): Promise<void> => {
    const aesKey = await generateAESKey();
    const encryptedData = await encryptPrivateKey(aesKey, privateKey);

    const exportedKey = await crypto.subtle.exportKey("raw", aesKey);
    const keyBase64 = uint8ArrayToBase64(new Uint8Array(exportedKey));

    localStorage.setItem(
      "encrypted_private_key",
      JSON.stringify(encryptedData)
    );
    localStorage.setItem("aes_key", keyBase64);
  };

  // Load the encrypted private key and AES key from localStorage
  const loadPrivateKeyFromLocalStorage = async (): Promise<string | null> => {
    const encryptedDataString = localStorage.getItem("encrypted_private_key");
    const aesKeyBase64 = localStorage.getItem("aes_key");

    if (!encryptedDataString || !aesKeyBase64) {
      console.error(
        "No encrypted private key or AES key found in localStorage"
      );
      return null;
    }

    const encryptedData: EncryptedData = JSON.parse(encryptedDataString);

    const aesKey = await crypto.subtle.importKey(
      "raw",
      base64To8Uint8Array(aesKeyBase64),
      { name: "AES-GCM" },
      true,
      ["decrypt"]
    );

    return await decryptPrivateKey(aesKey, encryptedData);
  };

  // Generate keypair upon register
  const generateKeyPair = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    );

    const exportedPublicKey = await window.crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey
    );

    const publicKeyPem = uint8ArrayToBase64(new Uint8Array(exportedPublicKey));

    const exportedPrivateKey = await window.crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
    );

    const privateKeyPem = uint8ArrayToBase64(new Uint8Array(exportedPrivateKey));

    return { publicKeyPem, privateKeyPem };
  };

  const signChallenge = async (privateKeyPem: string, challenge: string) => {
    const binaryKey = base64To8Uint8Array(privateKeyPem);

    const importedKey = await window.crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const encodedChallenge = strToUint8Array(challenge);

    const signature = await window.crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      importedKey,
      encodedChallenge
    );

    return uint8ArrayToBase64(new Uint8Array(signature));
  };

  return {
    signChallenge,
    generateKeyPair,
    savePrivateKeyToLocalStorage,
    loadPrivateKeyFromLocalStorage,
  };
};

export default useAuthUtils;