import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import morgan from "morgan";
dotenv.config();

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
  });

const sensorDataSchema = new mongoose.Schema({
  timestamp: {
    type: String,
    default: () => new Date().toISOString(),
  },
  time: {
    type: String,
  },
  hashed_string: {
    type: String,
  },
  accelerometer: {
    x: Number,
    y: Number,
    z: Number,
  },
  gyroscope: {
    x: Number,
    y: Number,
    z: Number,
  },
  magnetometer: {
    x: Number,
    y: Number,
    z: Number,
  },
  geolocation: {
    altitude: Number,
    heading: Number,
    altitudeAccuracy: Number,
  },
});

const SensorData = mongoose.model("SensorData", sensorDataSchema);

app.post("/send-data", async (req, res) => {
  const {
    time,
    hashed_string,
    accelerometer,
    gyroscope,
    magnetometer,
    geolocation,
  } = req.body;

  console.log("Received Sensor Data:", req.body);

  const newData = new SensorData({
    time,
    hashed_string,
    accelerometer,
    gyroscope,
    magnetometer,
    geolocation,
  });

  try {
    await newData.save();
    res.status(200).json({ message: "Sensor data stored successfully" });
  } catch (error) {
    console.error("Error saving data to MongoDB:", error);
    res.status(500).json({ error: "Failed to store sensor data" });
  }
});

app.get("/get-data", async (req, res) => {
  try {
    const data = await SensorData.find();
    res.status(200).json({ data });
  } catch (error) {
    console.error("Error retrieving data from MongoDB:", error);
    res.status(500).json({ error: "Failed to retrieve sensor data" });
  }
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
