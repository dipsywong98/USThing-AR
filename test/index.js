const assert = require("assert");
const obtainArJSON = require("../refactor");
const fs = require("fs");

const path = "./test_cases/dipsy.html";
// const path = './test_cases/acadreq.html'
const obtainArHTML = () => fs.readFileSync(path).toString();
const json = obtainArJSON(obtainArHTML());

// console.log(json);

const cc = json[1];
const total = json[0];

const cc_ans = JSON.parse(fs.readFileSync("./test/cc.json").toString());
const total_ans = JSON.parse(fs.readFileSync("./test/total.json").toString());

describe("true", () => {
  it("hello world", () => {
    assert.equal(1, 1);
  });
});

require("./cc")(cc, cc_ans);
require("./total")(total, total_ans);
