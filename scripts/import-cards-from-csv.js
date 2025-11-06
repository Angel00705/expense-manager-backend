// scripts/import-cards-from-csv.js
import mongoose from "mongoose";
import csv from "csv-parser";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

// Подключаемся к базе данных
const MONGODB_URI = process.env.MONGODB_URI;
await mongoose.connect(MONGODB_URI);
console.log("✅ Подключено к MongoDB");

// Создаём простые модели (IP и Card)
const ipSchema = new mongoose.Schema({ name: String, region: String });
const cardSchema = new mongoose.Schema({
  ipId: mongoose.Schema.Types.ObjectId,
  type: String,
  numberMask: String,
  status: String,
});
const IP = mongoose.model("IP", ipSchema);
const Card = mongoose.model("Card", cardSchema);

// Укажи имя своего файла
const csvFile = "cards.csv"; // файл загрузим в Render чуть позже

let currentRegion = null;

fs.createReadStream(csvFile)
  .pipe(csv())
  .on("data", async (row) => {
    try {
      const ipRaw = row["ИП / РЕГИОН"] || row["IP / REGION"];
      const regionCell = row["Unnamed: 1"] || row["Регион"];
      const corpCard = row["Корп. карта"];
      const flCard = row["Карта ФЛ"];
      const status = row["Октябрь 2025"];

      const name = String(ipRaw || "").trim();
      const region = String(regionCell || "").trim();
      if (region) currentRegion = region;
      if (!name || !currentRegion) return;

      let ip = await IP.findOne({ name, region: currentRegion });
      if (!ip) ip = await IP.create({ name, region: currentRegion });

      const makeCard = async (mask, type) => {
        if (!mask) return;
        const numberMask = String(mask).trim();
        const exists = await Card.findOne({ ipId: ip._id, numberMask, type });
        if (!exists)
          await Card.create({ ipId: ip._id, type, numberMask, status });
      };

      await makeCard(corpCard, "corp");
      await makeCard(flCard, "personal");
    } catch (err) {
      console.error("Ошибка строки:", err.message);
    }
  })
  .on("end", async () => {
    console.log("✅ Импорт завершён");
    await mongoose.disconnect();
  });
