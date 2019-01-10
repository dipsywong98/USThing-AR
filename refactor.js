const cheerio = require("cheerio");
let $;

/** Notes:
 *  Descriptions always contained by span.PSLONGEDITBOX
 */

/**
 * remove starting and ending whitespaces
 *
 * @param {String} str
 * @return {String}
 */
const trim = str => str.replace(/^\s+/, "").replace(/\s+$/, "");

/**
 * extract innertext of element
 *
 * @param {cheerio} element a cheerio object
 * @param {int} d depth of element, 0 denote the starting depth, helper only
 * @return {String}
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

const isPlaceholderTr = tr => {
  // console.log(tr)
  // console.log('tr',tr.type)
  if (tr.name != "tr") {
    // console.log('gg')
    return false;
  } else {
    let tds = cheerio(tr).children("td");
    // console.log(tds.length)
    if (tds.length !== cheerio(tr).find("td").length) {
      // console.log('a')
      return false;
    } else {
      let childrenCount = tds
        .toArray()
        .reduce((prev, currv) => prev + currv.children.length, 0);
      // console.log('b',childrenCount)
      return childrenCount === 0;
    }
  }
};

/**
 * extract information of academic requirement html
 * @param {String} arHTML
 * @return {Object}
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
 * @return {Object}
 */
const mapRequirementTable = table => {
  let ret = {};
  const [name, rg] = getInnerText($(table).find(".PSGROUPBOXLABEL")[0])
    .replace(/]\s+$/, "")
    .split("[")
    .map(trim);
  const contentTbody = $($(table).find("table.PABACKGROUNDINVISIBLE")[0]).find(
    "tbody"
  )[0];
  const contentTrs = $(contentTbody).children("tr");
  const { satisfied, descriptions } = processDescriptions(
    $(contentTrs[1]).find("span.PSLONGEDITBOX")[0]
  );
  const requiredLis = $(contentTrs[2])
    .find("li")
    .toArray();
  ret = requiredLis.reduce((prev, li) => ({ ...prev, ...processLi(li) }), ret);
  let areaTable = contentTrs.toArray().reduce((prev, tr) => {
    if (!!prev) return prev;
    const tableQuery = $(tr).find('table[id*="SAA_ARSLT_RLVW$scroll$"]');
    if (tableQuery.length > 0) return tableQuery[0];
  }, null);
  let areas;
  if (!!areaTable) {
    const areaTrs = $($(areaTable).find("table.PSLEVEL1SCROLLAREABODYNBO")[0])
      .children("tbody")
      .children("tr")
      .toArray()
      .filter(tr => !isPlaceholderTr(tr));
    areas = clusterTrsIntoAreas(areaTrs).map(mapTrsToArea);
  }
  return {
    name,
    rg: rg && rg.match(/\d+/)[0],
    satisfied,
    descriptions,
    ...ret,
    areas
  };
};

/**
 *
 * @param {Array[cheerio]} areaTrs
 * @return {Array[Array[cheerio]]}
 */
const clusterTrsIntoAreas = areaTrs => {
  return areaTrs.reduce(
    (prev, currv) => {
      const $ = cheerio(currv);
      if ($.find(".PAGROUPDIVIDER").length > 0) {
        prev.push([currv]);
      } else {
        prev[prev.length - 1].push(currv);
      }
      return prev;
    },
    [[]]
  );
};

/**
 * the trs have several cases:
 * 0. contain td.PAGROUPDIVIDER which is name
 * 1. contain span.PSLONGEDITBOX, which is descriptions (before see a 3)
 * 2. contain li, which is [units/ courses/ GPA] progress and requirement (before see a 3)
 * 3. contain table.PABACKGROUNDINVISIBLE which is an additional criteria
 * inside 3, it may contain table.PSLEVEL4GRIDNBO which contains all course details
 *
 * @param {Array[cheerio]} trs
 */
const mapTrsToArea = trs => {
  let processedCriteria = false;
  let ret = {};
  trs.forEach(tr => {
    const tableQ = $(tr).find("table.PABACKGROUNDINVISIBLE");
    if (tableQ.length > 0) {
      processedCriteria = true;
    } else if (!processedCriteria) {
      const nameQ = $(tr).find("td.PAGROUPDIVIDER");
      const spanQ = $(tr).find("span.PSLONGEDITBOX");
      const lis = $(tr).find("li");
      if (nameQ.length > 0) {
        ret.name = getInnerText(nameQ[0]);
      } else if (spanQ.length > 0) {
        ret = { ...ret, ...processDescriptions(spanQ[0]) };
      } else if (lis.length > 0) {
        ret = lis.reduce((prev, li) => ({ ...prev, ...processLi(li) }), ret);
      }
    }
  });
  return ret;
};

/**
 *
 * @param {cheerio} li
 * @return {Object}
 */
const processLi = li => {
  const str = getInnerText(li);
  const key = str.match(/^\w+/)[0].toLowerCase();
  const ret = {};
  if (str.indexOf("required") !== -1)
    ret.required = Number(str.match(/([\d.]+) required/)[1]);
  if (str.indexOf("taken") !== -1)
    ret.taken = Number(str.match(/([\d.]+) taken/)[1]);
  if (str.indexOf("needed") !== -1)
    ret.needed = Number(str.match(/([\d.]+) needed/)[1]);
  if (str.indexOf("actual") !== -1)
    ret.actual = Number(str.match(/([\d.]+) actual/)[1]);
  return { [key]: ret };
};

/**
 *
 * @param {cheerio} tbody
 */
const processContentTbody = tbody => {
  trs[1].find("span.PSLONGEDITBOX")[0];
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
