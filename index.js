// const request = require('request')
const fs = require('fs')
const cheerio = require('cheerio')
const obtainArJSON = require('./obtain-ar-jSON')

const obtainArHTML = ()=>fs.readFileSync('./test_cases/comp_2minors.html').toString()

console.log(obtainArJSON(obtainArHTML()))