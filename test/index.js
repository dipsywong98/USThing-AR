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

describe("cc", () => {
  it("name", () => {
    assert.equal(cc.name, cc_ans.name);
  });
  it("rg", () => {
    assert.equal(cc.rg, cc_ans.rg);
  });
  it("satisfied", () => {
    assert.equal(cc.satisfied, cc_ans.satisfied);
  });
  it("descriptions", () => {
    assert.deepEqual(cc.descriptions, cc_ans.descriptions);
  });
});

describe("total", () => {
  it("name", () => {
    assert.equal(total.name, total_ans.name);
  });
  it("rg", () => {
    assert.equal(total.rg, total_ans.rg);
  });
  it("satisfied", () => {
    assert.equal(total.satisfied, total_ans.satisfied);
  });
  it("descriptions", () => {
    assert.deepEqual(total.descriptions, total_ans.descriptions);
  });
});
