import dns from 'node:dns';
import mongoose from "mongoose";
import config from "./config.js";

dns.setServers(['8.8.8.8', '8.8.4.4']);

async function connectDB() {
    await mongoose.connect(config.MONGO_URI);
    console.log("Connected to DB");
}

export default connectDB;