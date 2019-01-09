const cheerio = require("cheerio");

const getInnerText = (element, d = 0) => {
  if (!element) return "";
  if (element.name === "img") {
    if (element.attribs.src.match("PS_CS_CREDIT_TAKEN_ICN_1.gif")) {
      return "Taken";
    } else if (element.attribs.src.match("PS_CS_COURSE_ENROLLED_ICN_1.gif")) {
      return "In Progress";
    } else if (element.attribs.src.match("PS_CS_COURSE_PLANNED_ICN_1.gif")) {
      return "Planned";
    } else {
      return "";
    }
  }
  if (!element.children) {
    if (element.type === "text") {
      return element.data;
    } else {
      return "";
    }
  }
  if (element.children.length === 0) return "";
  let innertext = element.children.reduce(
    (prev, currv) => prev + getInnerText(currv, d + 1),
    ""
  );
  if (d === 0) return innertext.replace(/\s+/g, " ");
  return innertext;
};

const main = arHTML => {
  const $ = cheerio.load(arHTML);
  const requirementGroupTables = $(".PSGROUPBOXWBO").toArray();
  // const requirements = [
  //   obtainGroupObject(requirementGroupTables[0]),
  //   obtainGroupObject(requirementGroupTables[1])
  // ];
  const requirements = requirementGroupTables.map(obtainGroupObject);
  return requirements;
};
