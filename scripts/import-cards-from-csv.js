const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');

const IP = require('../models/IP');
const Card = require('../models/Card');

require('dotenv').config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Подключено к MongoDB');

  // Очищаем старые данные
  await Card.deleteMany({});
  await IP.deleteMany({});

  const csvData = `
ИП / РЕГИОН,,Корп. карта,Карта ФЛ,Октябрь 2025,
,,,,Корп. карта,Карта ФЛ
ИП Крутоусов,Астрахань,*3420,*7367,в регионе,
ИП Храмова,,*5049,*4455,В ПВЗ Наливайко,в регионе
ИП Янгалышева А.,,*2468,*9647,в регионе,в регионе
ИП НАЛИВАЙКО,,*8098,-,в регионе,
ИП КАШИРИН В.Г.,,*7969,-,в регионе,
ИП Астанови Араз,Бурятия (УЛАН-УДЭ),*7651,--,в регионе,
ИП Пинегин,,,*3475,,в регионе
ИП Ровда А.Ю.,,*8829,*5833,в регионе,в регионе
ИП ИЛЬЕНКО,,*8325,*5865,в регионе,Перевыпустить
ИП Бондаренко Л.И. ,Курган,*7254,*5664,в регионе,в регионе
ИП Бобков,,*1381,*2911,В ПВЗ Овсейко,в регионе
ИП Дюльгер,,*9895,--,в регионе,
ИП Федчук,,*9967,--,в регионе,
ИП КАРБЫШЕВ,,*2937,--,в регионе,
ИП ОВСЕЙКО,,*1946,--,в регионе,
ИП РЯБЕНКО И.И,,-,*6532,,
,,,*7611,,У Никиты Р.
ИП Ибрагимов Ш,Калмыкия (ЭЛИСТА),*5109,*7068,в регионе,в регионе
ИП Никифорова,,*4821,*5341,в регионе,в регионе
ИП Ярославцев Г.В.,,*7570,--,в регионе,
ИП Иванов,Мордовия (САРАНСК),*7184,*3487,в регионе,
ИП Коротких,,*8701,--,в регионе,
ИП Яковлева,,*4679,*0952,в регионе,в регионе
ИП Бадалов,Удмуртия (ИЖЕВСК),,*8406,,в регионе
ИП Емельянов Г. И.,,*4454,*7289,В ПВЗ Леонгард,в регионе
ИП Леонгард,,*1749,*9648,В ПВЗ Емельянов,в регионе
ИП Саинова,,*5313,*0628,В ПВЗ Шефер,в регионе
ИП Самсонов А.Д.,,*5995,*3500,в регионе,в регионе
ИП Шефер,,*1767,,в регионе,
`.trim();

  const lines = csvData.split('\n').slice(2); // Пропускаем заголовки
  let currentRegion = '';
  let importedCount = 0;

  for (const line of lines) {
    const columns = line.split(',').map(col => col.trim());
    
    const ipName = columns[0];
    const region = columns[1] || currentRegion;
    const corpCard = columns[2];
    const personalCard = columns[3];
    const corpStatus = columns[4];
    const personalStatus = columns[5];

    if (region) currentRegion = region;
    if (!ipName) continue;

    try {
      // Создаем или находим ИП
      let ip = await IP.findOne({ name: ipName, region });
      if (!ip) {
        ip = await IP.create({ name: ipName, region });
      }

      // Создаем корпоративную карту если есть
      if (corpCard && corpCard !== '-' && corpCard !== '--') {
        await Card.create({
          ipId: ip._id,
          type: 'corp',
          numberMask: corpCard,
          status: corpStatus || '',
          months: {
            'Октябрь 2025': {
              corporate: corpStatus || null
            }
          }
        });
        importedCount++;
      }

      // Создаем персональную карту если есть
      if (personalCard && personalCard !== '-' && personalCard !== '--') {
        await Card.create({
          ipId: ip._id,
          type: 'personal',
          numberMask: personalCard,
          status: personalStatus || '',
          months: {
            'Октябрь 2025': {
              personal: personalStatus || null
            }
          }
        });
        importedCount++;
      }

    } catch (error) {
      console.error(`Ошибка импорта для ${ipName}:`, error.message);
    }
  }

  console.log(`✅ Импорт завершен! Добавлено ${importedCount} карт`);
  await mongoose.disconnect();
}

main().catch(console.error);
