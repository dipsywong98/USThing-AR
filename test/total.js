const assert = require("assert");
module.exports = (total, total_ans) => {
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
    it("entire", () => {
      assert.deepEqual(total, total_ans);
    });
  });
};
