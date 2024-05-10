const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const app = express();
app.set("views", path.resolve(__dirname, "templates"));
app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(express.static("public"));
process.stdin.setEncoding("utf8");
let portNumber = 3000;
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

let apiKey = process.env.API_KEY;
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const db = process.env.MONGO_DB_NAME;
const dbCollection = process.env.MONGO_COLLECTION;
const databaseAndCollection = { db: db, collection: dbCollection };
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${userName}:${password}@cluster0.4feqygv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(`Web server started and running at: http://localhost:${portNumber}`);

/* HTTP REQUESTS */

app.get("/", (request, response) => {
  response.render("index");
});

app.get("/searchHero", (request, response) => {
  response.render("searchForHero");
});

app.post("/searchHeroResult", async (request, response) => {
  let url = `https://superheroapi.com/api/${apiKey}/search`;
  let heroName = request.body.name;
  try {
    let result = await fetch(url + `/${heroName}`);
    let json = await result.json();
    if (json.response != "error") {
      let powerStats = json?.results[0]?.powerstats;
      let variables = {
        heroName: heroName,
        heroIntelligence: powerStats.intelligence,
        heroStrength: powerStats.strength,
        heroSpeed: powerStats.speed,
        heroImage: json.results[0]?.image.url,
      };
      response.render("searchHeroResult", variables);
    } else {
      response.render("heroNotFound", { heroName: heroName });
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
  let url = `https://superheroapi.com/api/${apiKey}/search`;
  let heroName1 = request.body.name1;
  let heroName2 = request.body.name2;
  try {
    let result1 = await fetch(url + `/${heroName1}`);
    let result2 = await fetch(url + `/${heroName2}`);
    let json1 = await result1.json();
    let json2 = await result2.json();
    if (json1.response != "error" && json2.response != "error") {
      let powerStats1 = json1?.results[0]?.powerstats;
      let powerStats2 = json2?.results[0]?.powerstats;
      let variables = {
        heroName1: heroName1,
        heroIntelligence1: powerStats1.intelligence,
        heroStrength1: powerStats1.strength,
        heroSpeed1: powerStats1.speed,
        heroImage1: json1.results[0]?.image.url,
        heroName2: heroName2,
        heroIntelligence2: powerStats2.intelligence,
        heroStrength2: powerStats2.strength,
        heroSpeed2: powerStats2.speed,
        heroImage2: json2.results[0]?.image.url,
        heroScore1: ((Number(powerStats1.intelligence) + Number(powerStats1.strength) + Number(powerStats1.speed)) / 3).toFixed(2),
        heroScore2: ((Number(powerStats2.intelligence) + Number(powerStats2.strength) + Number(powerStats2.speed)) / 3).toFixed(2),
        winner:
          (Number(powerStats1.intelligence) + Number(powerStats1.strength) + Number(powerStats1.speed)) / 3 >
          (Number(powerStats2.intelligence) + Number(powerStats2.strength) + Number(powerStats2.speed)) / 3
            ? heroName1
            : heroName2,
      };
      response.render("battleHeroesResult", variables);
      await client.connect();
      /* SEND BATTLE INFO */
      const battleData = {
        heroName1: request.body.name1,
        heroName2: request.body.name2,
        heroScore1: ((Number(powerStats1.intelligence) + Number(powerStats1.strength) + Number(powerStats1.speed)) / 3).toFixed(2),
        heroScore2: ((Number(powerStats2.intelligence) + Number(powerStats2.strength) + Number(powerStats2.speed)) / 3).toFixed(2),
        winner:
          (Number(powerStats1.intelligence) + Number(powerStats1.strength) + Number(powerStats1.speed)) / 3 >
          (Number(powerStats2.intelligence) + Number(powerStats2.strength) + Number(powerStats2.speed)) / 3
            ? heroName1
            : heroName2,
        image1: json1.results[0]?.image.url,
        image2: json2.results[0]?.image.url,
      };
      await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(battleData);
    } else {
      response.render("matchupNotBooked", { heroName1: heroName1, heroName2: heroName2 });
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
            <h2 class="battleLog">${obj.heroName1} vs ${obj.heroName2}</h2>
            <div id="battleHistoryPictures">
              <div id="image-div">
                <img src="${obj.image1}" alt="${obj.heroName1}" height="400">
              </div>
              <div class="scoreDisplay">
                ${obj.heroScore1} - ${obj.heroScore2}
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

app.listen(portNumber);
