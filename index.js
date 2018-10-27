// const request = require('request')
const fs = require('fs')
const cheerio = require('cheerio')
const obtainArJSON = require('./obtain-ar-jSON')

const obtainArHTML = ()=>fs.readFileSync('./test_cases/comp_2minors.html').toString()
const json = obtainArJSON(obtainArHTML()) 
console.log(json)
fs.writeFileSync('./out.json',JSON.stringify(json,null,2))