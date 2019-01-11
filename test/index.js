const assert = require("assert");
const obtainArJSON = require("../refactor");
const fs = require("fs");

const path = "./test_cases/dipsy.html";
// const path = './test_cases/acadreq.html'
const obtainArHTML = () => fs.readFileSync(path).toString();
const json = obtainArJSON(obtainArHTML());

// console.log(json);

const single = json[6];
const english = json[2];
const cc = json[1];
const total = json[0];

const single_ans = JSON.parse(fs.readFileSync("./test/single.json").toString());
const english_ans = JSON.parse(
  fs.readFileSync("./test/english.json").toString()
);
const cc_ans = JSON.parse(fs.readFileSync("./test/cc.json").toString());
const total_ans = JSON.parse(fs.readFileSync("./test/total.json").toString());

describe("true", () => {
  it("hello world", () => {
    assert.equal(1, 1);
  });
});

require("./cc")(cc, cc_ans);
require("./total")(total, total_ans);
describe("english", () => {
  it("all", () => {
    assert.deepEqual(english, english_ans);
  });
});

describe("single", () => {
  it("all", () => {
    assert.deepEqual(single, single_ans);
  });
});
