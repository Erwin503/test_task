"use strict";
const { Sequelize, DataTypes } = require("sequelize");
const fs = require("fs");
const path = require("path");
const axios = require('axios');

const homedir = require("os").homedir();
const certPath = path.join(homedir, ".postgresql", "root.crt");

// Настройка соединения с базой данных
const sequelize = new Sequelize("db1", "candidate", "62I8anq3cFq5GYh2u4Lh", {
  host: "rc1b-r21uoagjy1t7k77h.mdb.yandexcloud.net",
  port: 6432,
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync(certPath, "utf8").toString(),
    },
  },
});

const Character = sequelize.define(
  "Character",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    tableName: "characters",
    timestamps: false,
  }
);

const createTable = async () => {
  try {
    await sequelize.authenticate();
    console.log("Соединение установлено успешно.");
    await Character.sync({ force: true });
    console.log("Таблица создана успешно.");
  } catch (error) {
    console.error("Не удалось подключиться к базе данных:", error);
  }
};

const pullCharacters = async () => {
  try {
    await createTable();

    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      const response = await axios.get(`https://rickandmortyapi.com/api/character/?page=${page}`);
      const results = response.data.results;

      if (results.length > 0) {
        const characters = results.map(item => ({ name: item.name, data: item }));
        await Character.bulkCreate(characters);
        console.log(`Страница ${page} обработана.`);
      }

      hasNextPage = response.data.info.next !== null;
      page += 1;
    }

    console.log("Все персонажи успешно загружены.");
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
  } finally {
    await sequelize.close();
  }
};

pullCharacters();
