const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const fetch = require("node-fetch");

const username = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const apiKey = process.env.API_KEY;
const databaseAndCollection = { db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION };
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${username}:${password}@cluster0.4feqygv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

const portNumber = 3000;
app.listen(portNumber);
console.log(`Web server started and running at: http://localhost:${portNumber}`);
process.stdin.setEncoding("utf8");

/* HTTP REQUESTS */

app.get("/", (request, response) => {
  response.render("index");
});

app.get("/searchHero", (request, response) => {
  response.render("searchForHero");
});

app.post("/searchHeroResult", async (request, response) => {
  try {
    let name = request.body.name;
    let result = await fetch(`https://superheroapi.com/api/${apiKey}/search/${name}`);
    let json = await result.json();
    if (json.response != "error") {
      let variables = {
        name: name,
        intelligence: json.results[0].powerstats.intelligence,
        strength: json.results[0].powerstats.strength,
        speed: json.results[0].powerstats.speed,
        durability: json.results[0].powerstats.durability,
        power: json.results[0].powerstats.power,
        combat: json.results[0].powerstats.combat,
        fullname: json.results[0].biography["full-name"],
        alteregos: json.results[0].biography["alter-egos"],
        aliases: json.results[0].biography.aliases,
        placeofbirth: json.results[0].biography["place-of-birth"],
        gender: json.results[0].appearance.gender,
        race: json.results[0].appearance.race,
        height: json.results[0].appearance.height,
        weight: json.results[0].appearance.weight,
        eyecolor: json.results[0].appearance["eye-color"],
        haircolor: json.results[0].appearance["hair-color"],
        image: json.results[0].image.url,
      };
      response.render("searchHeroResult", variables);
    } else {
      response.render("heroNotFound", { name: name });
    }
  } catch (e) {
    console.log(e);
  } finally {
    console.log("Worked");
  }
});

app.get("/battleHeroes", (request, response) => {
  response.render("battleHeroes");
});

app.post("/battleHeroesResult", async (request, response) => {
  /* GET HEROES FOR BATTLE */
  try {
    let name1 = request.body.name1;
    let name2 = request.body.name2;
    let result1 = await fetch(`https://superheroapi.com/api/${apiKey}/search/${name1}`);
    let result2 = await fetch(`https://superheroapi.com/api/${apiKey}/search/${name2}`);
    let json1 = await result1.json();
    let json2 = await result2.json();
    if (json1.response != "error" && json2.response != "error") {
      let variables = {
        name1: name1,
        intelligence1: json1.results[0].powerstats.intelligence,
        strength1: json1.results[0].powerstats.strength,
        speed1: json1.results[0].powerstats.speed,
        durability1: json1.results[0].powerstats.durability,
        power1: json1.results[0].powerstats.power,
        combat1: json1.results[0].powerstats.combat,
        image1: json1.results[0].image.url,
        name2: name2,
        intelligence2: json2.results[0].powerstats.intelligence,
        strength2: json2.results[0].powerstats.strength,
        speed2: json2.results[0].powerstats.speed,
        durability2: json2.results[0].powerstats.durability,
        power2: json2.results[0].powerstats.power,
        combat2: json2.results[0].powerstats.combat,
        image2: json2.results[0].image.url,
        score1:
          Number(json1.results[0].powerstats.intelligence) +
          Number(json1.results[0].powerstats.strength) +
          Number(json1.results[0].powerstats.speed) +
          Number(json1.results[0].powerstats.durability) +
          Number(json1.results[0].powerstats.power) +
          Number(json1.results[0].powerstats.combat),
        score2:
          Number(json2.results[0].powerstats.intelligence) +
          Number(json2.results[0].powerstats.strength) +
          Number(json2.results[0].powerstats.speed) +
          Number(json2.results[0].powerstats.durability) +
          Number(json2.results[0].powerstats.power) +
          Number(json2.results[0].powerstats.combat),
        winner:
          Number(json1.results[0].powerstats.intelligence) +
            Number(json1.results[0].powerstats.strength) +
            Number(json1.results[0].powerstats.speed) +
            Number(json1.results[0].powerstats.durability) +
            Number(json1.results[0].powerstats.power) +
            Number(json1.results[0].powerstats.combat) >
          Number(json2.results[0].powerstats.intelligence) +
            Number(json2.results[0].powerstats.strength) +
            Number(json2.results[0].powerstats.speed) +
            Number(json2.results[0].powerstats.durability) +
            Number(json2.results[0].powerstats.power) +
            Number(json2.results[0].powerstats.combat)
            ? name1
            : name2,
      };
      response.render("battleHeroesResult", variables);
      await client.connect();
      /* SEND BATTLE INFO */
      const battleData = {
        name1: request.body.name1,
        name2: request.body.name2,
        score1:
          Number(json1.results[0].powerstats.intelligence) +
          Number(json1.results[0].powerstats.strength) +
          Number(json1.results[0].powerstats.speed) +
          Number(json1.results[0].powerstats.durability) +
          Number(json1.results[0].powerstats.power) +
          Number(json1.results[0].powerstats.combat),
        score2:
          Number(json2.results[0].powerstats.intelligence) +
          Number(json2.results[0].powerstats.strength) +
          Number(json2.results[0].powerstats.speed) +
          Number(json2.results[0].powerstats.durability) +
          Number(json2.results[0].powerstats.power) +
          Number(json2.results[0].powerstats.combat),
        winner:
          Number(json1.results[0].powerstats.intelligence) +
            Number(json1.results[0].powerstats.strength) +
            Number(json1.results[0].powerstats.speed) +
            Number(json1.results[0].powerstats.durability) +
            Number(json1.results[0].powerstats.power) +
            Number(json1.results[0].powerstats.combat) >
          Number(json2.results[0].powerstats.intelligence) +
            Number(json2.results[0].powerstats.strength) +
            Number(json2.results[0].powerstats.speed) +
            Number(json2.results[0].powerstats.durability) +
            Number(json2.results[0].powerstats.power) +
            Number(json2.results[0].powerstats.combat)
            ? name1
            : name2,
        image1: json1.results[0]?.image.url,
        image2: json2.results[0]?.image.url,
      };
      await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(battleData);
    } else {
      response.render("matchupNotBooked", { name1: name1, name2: name2 });
    }
  } catch (e) {
    console.log(e);
  } finally {
    console.log("Worked");
  }
});

app.get("/battleHistory", async (request, response) => {
  try {
    await client.connect();
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find({});
    const arr = await result.toArray();
    html = "";
    arr.forEach((obj) => {
      html += `
            <h2 class="battleLog">${obj.name1} vs ${obj.name2}</h2>
            <div id="battleHistoryPictures">
              <div id="image-div">
                <img src="${obj.image1}" alt="${obj.heroName1}" height="400">
              </div>
              <div class="scoreDisplay">
                ${obj.score1} - ${obj.score2}
              </div>
              <div id="image-div">
                <img src="${obj.image2}" alt="${obj.heroName2}" height="400">
              </div>
            </div>
            <h2 class="battleLog">Winner: ${obj.winner}</h2>
            <hr>
            `;
    });
    response.render("battleHistory", { log: html });
  } catch (e) {
    console.log(e);
  } finally {
    await client.close();
  }
});
