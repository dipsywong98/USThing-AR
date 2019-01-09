const cheerio = require("cheerio");
let $;

/** Notes:
 *  Descriptions always contained by span.PSLONGEDITBOX
 */

/**
 * remove starting and ending whitespaces
 *
 * @param {String} str
 */
const trim = str => str.replace(/^\s+/, "").replace(/\s+$/, "");

/**
 * extract innertext of element
 *
 * @param {cheerio} element a cheerio object
 * @param {int} d depth of element, 0 denote the starting depth, helper only
 */
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
  if (d === 0) return trim(innertext.replace(/\s+/g, " "));
  return trim(innertext);
};

/**
 * extract information of academic requirement html
 * @param {String} arHTML
 */
const main = arHTML => {
  $ = cheerio.load(arHTML);
  const requirementTables = $(".PSGROUPBOXWBO").toArray();
  const requirements = [
    mapRequirementTable(requirementTables[0]),
    mapRequirementTable(requirementTables[1])
  ];
  // const requirements = requirementTables.map(mapRequirementTable);
  return requirements;
};

/**
 *
 * @param {cheerio} table deep blue colored table
 */
const mapRequirementTable = table => {
  const [name, rg] = getInnerText($(table).find(".PSGROUPBOXLABEL")[0])
    .replace(/]\s+$/, "")
    .split("[")
    .map(trim);
  const { satisfied, descriptions } = processDescriptions(
    $(table).find("span.PSLONGEDITBOX")[0]
  );
  return { name, rg: rg && rg.match(/\d+/)[0], satisfied, descriptions };
};

/**
 *
 * @param {cheerio} span
 */
const processDescriptions = span => {
  const descriptions = span.children.reduce((prev, el) => {
    if (el.type === "text") {
      const s = el.data.replace(/(^\s+|\s+$)/g, "").replace(/[\s\n]+/g, " ");
      if (s !== "") prev.push(s);
    }
    return prev;
  }, []);
  let satisfied = getInnerText($(span).find("strong")[0]);
  if (satisfied === "Not Satisfied:") {
    satisfied = false;
  } else if (satisfied === "Satisfied:") {
    satisfied = true;
  } else {
    satisfied = null;
  }
  return { satisfied, descriptions };
};

module.exports = main;
