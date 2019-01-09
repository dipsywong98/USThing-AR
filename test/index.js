const assert = require("assert");
const obtainArJSON = require("../obtain-ar-json");
const fs = require("fs");

const path = "./test_cases/dipsy.html";
// const path = './test_cases/acadreq.html'
const obtainArHTML = () => fs.readFileSync(path).toString();
const json = obtainArJSON(obtainArHTML());

// console.log(json);

const cc = json[1];

const cc_ans = JSON.parse(fs.readFileSync("./test/cc.json").toString());

describe("true", () => {
  it("hello world", () => {
    assert.equal(1, 1);
  });
});

describe("cc", () => {
  it("name", () => {
    assert.equal(cc.name, cc_ans.name);
  });
});
