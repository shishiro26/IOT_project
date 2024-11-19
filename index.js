import express from "express";
import { Crypto } from "@peculiar/webcrypto";
import cors from "cors";

const port = 4000;
const app = express();
const crypto = new Crypto();

app.use(cors());

function adjustKeyLength(key, requiredLength) {
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(key);

  if (keyBytes.length === requiredLength) {
    return keyBytes;
  } else if (keyBytes.length < requiredLength) {
    // Pad the key if it's too short
    const paddedKey = new Uint8Array(requiredLength);
    paddedKey.set(keyBytes);
    return paddedKey;
  } else {
    // Truncate the key if it's too long
    return keyBytes.slice(0, requiredLength);
  }
}


async function encryptAES(message, key) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  // Adjust key to match AES requirements (16 bytes for AES-128)
  const aesKey = await crypto.subtle.importKey(
    "raw",
    adjustKeyLength(key, 16), // Adjust key to 16 bytes
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    data
  );

  const result = new Uint8Array(iv.length + encryptedData.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encryptedData), iv.length);

  return result;
}

async function encryptDES(message, key) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  // Adjust key to match DES-EDE3 requirements (24 bytes)
  const desKey = await crypto.subtle.importKey(
    "raw",
    adjustKeyLength(key, 24), // Adjust key to 24 bytes
    { name: "DES-EDE3" },
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(8));

  const encryptedData = await crypto.subtle.encrypt(
    { name: "DES-EDE3", iv },
    desKey,
    data
  );

  const result = new Uint8Array(iv.length + encryptedData.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encryptedData), iv.length);

  return result;
}

app.get("/encrypt", async (req, res) => {
  const { message, key, algorithm } = req.query;

  // Ensure necessary parameters are provided
  if (!message || !key || !algorithm) {
    return res
      .status(400)
      .send(
        "Please provide 'message', 'key', and 'algorithm' query parameters."
      );
  }

  try {
    let encryptedMessage;

    if (algorithm.toLowerCase() === "aes") {
      encryptedMessage = await encryptAES(message, key);
    } else if (algorithm.toLowerCase() === "des") {
      encryptedMessage = await encryptDES(message, key);
    } else {
      return res
        .status(400)
        .send("Unsupported algorithm. Please choose either 'aes' or 'des'.");
    }

    const encryptedBase64 = Buffer.from(encryptedMessage).toString("base64");
    res.send({ encryptedMessage: encryptedBase64 });
  } catch (error) {
    console.error(error);
    res.status(500).send("Encryption failed.");
  }
});

app.use(express.static("public"));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
