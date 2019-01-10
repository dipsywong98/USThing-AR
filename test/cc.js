const assert = require("assert");
module.exports = (cc, cc_ans) => {
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
    it("units", () => {
      assert.deepEqual(cc.units, cc_ans.units);
    });
    describe("area A", () => {
      it("name", () => {
        assert.deepEqual(cc.areas[0].name, cc_ans.areas.name);
      });
      it("descriptions", () => {
        assert.deepEqual(cc.areas[0].descriptions, cc_ans.areas.descriptions);
      });
      it("units", () => {
        assert.deepEqual(cc.areas[0].units, cc_ans.areas.units);
      });
    });
  });
};
