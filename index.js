// const request = require('request')
const fs = require("fs");
const cheerio = require("cheerio");
const obtainArJSON = require("./src");
// console.log(process.argv)
const path = process.argv[2]||"./test_cases/dipsy.html";
// const path = './test_cases/acadreq.html'
const obtainArHTML = () => fs.readFileSync(path).toString();
const json = obtainArJSON(obtainArHTML());
// console.log(json);
fs.writeFileSync("./out.json", JSON.stringify(json, null, 2));
