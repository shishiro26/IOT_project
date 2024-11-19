import express from "express";
import { Crypto } from "@peculiar/webcrypto";

const port = 3000;
const app = express();
const crypto = new Crypto();

async function encryptAES(message, key) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  const aesKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
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

  const desKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
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
