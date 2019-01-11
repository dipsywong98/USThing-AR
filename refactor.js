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
  //map status icons into text
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
  // const requirements = [
  //   mapRequirementTable(requirementTables[0]),
  //   mapRequirementTable(requirementTables[1]),
  //   mapRequirementTable(requirementTables[2]),
  //   mapRequirementTable(requirementTables[3])
  // ];
  const requirements = requirementTables.map(mapRequirementTable);
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
  let areaTable = contentTrs.toArray().reduce((prev, tr) => {
    if (!!prev) return prev;
    const tableQuery = $(tr).find('table[id*="SAA_ARSLT_RLVW$scroll$"]');
    const spanQ = $(tr).find("span.PSLONGEDITBOX");
    const liQ = $(tr).find("li");
    if (tableQuery.length > 0) {
      return tableQuery[0];
    } else if (liQ.length > 0) {
      const requiredLis = liQ.toArray();
      ret = requiredLis.reduce(
        (prev, li) => ({ ...prev, ...processLi(li) }),
        ret
      );
    } else if (spanQ.length > 0) {
      ret = { ...ret, ...processDescriptions(spanQ[0]) };
    }
  }, null);
  let areas;
  if (!!areaTable) {
    const areaTrs = $($(areaTable).find("table.PSLEVEL1SCROLLAREABODYNBO")[0])
      .children("tbody")
      .children("tr")
      .toArray()
      .filter(tr => !isPlaceholderTr(tr));
    areas = clusterTrsIntoAreas(areaTrs).map(mapTrsToArea);
    ret = { ...areas.shift(), ...ret };
    if (areas.length > 0) ret.areas = areas;
  }
  return {
    name,
    rg: rg && Number(rg.match(/\d+/)[0]),
    ...ret
  };
};

/**
 *
 * @param {Array[cheerio]} areaTrs table.PSLEVEL1SCROLLAREABODYNBO>tbody>tr
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
 * Area is defined to be light blue sections
 *
 * the trs have several cases:
 * 0. contain td.PAGROUPDIVIDER which is name
 * 2. contain li, which is [units/ courses/ GPA] progress and requirement (before see a 3)
 * 1. contain span.PSLONGEDITBOX, which is descriptions (before see a 3)
 * 3. contain table.PSLEVEL1SCROLLAREABODYNBOWBO which is an additional criteria
 *
 * @param {Array[cheerio]} trs table.PSLEVEL1SCROLLAREABODYNBO>tbody>tr
 */
const mapTrsToArea = trs => {
  let processedCriteria = false;
  let retArea = { criteria: [] };
  trs.forEach(tr => {
    const tableQ = $(tr).find("table.PSLEVEL1SCROLLAREABODYNBOWBO");
    if (tableQ.length > 0) {
      processedCriteria = true;
      retArea.criteria.push(mapTableToCriteria(tableQ[0]));
    } else if (!processedCriteria) {
      const areaNameQ = $(tr).find("td.PAGROUPDIVIDER");
      const spanQ = $(tr).find("span.PSLONGEDITBOX");
      const lis = $(tr).find("li");
      if (areaNameQ.length > 0) {
        retArea.name = getInnerText(areaNameQ[0]);
      } else if (lis.length > 0) {
        retArea = lis
          .toArray()
          .reduce((prev, li) => ({ ...prev, ...processLi(li) }), retArea);
      } else if (spanQ.length > 0) {
        const descriptions = processDescriptions(spanQ[0]);
        retArea = { ...retArea, ...processDescriptions(spanQ[0]) };
      }
    }
  });
  if (retArea.criteria.length === 0) {
    delete retArea.criteria;
  }
  return retArea;
};

/**
 *
 * 2. contain li, which is [units/ courses/ GPA] progress and requirement
 * 1. contain span.PSLONGEDITBOX, which is descriptions
 * 3. contain table.PSLEVEL4GRIDNBO which contains course history related
 * @param {cheerio} table table.PSLEVEL1SCROLLAREABODYNBOWBO
 */
const mapTableToCriteria = table => {
  let retCriteria = {};
  retCriteria.name = getInnerText($(table).find("td.SSSTEXTDKBLUEBOLD10")[0]);
  const trs = $(table)
    .find("table.PABACKGROUNDINVISIBLE")
    .children("tbody")
    .children("tr")
    .toArray();
  // .filter(tr => !isPlaceholderTr(tr));
  const courseTableQ = $(table).find("table.PSLEVEL4GRIDNBO");
  if (courseTableQ.length > 0) {
    retCriteria.courseList = mapTableToCourses(courseTableQ[0]);
  }
  trs.forEach(tr => {
    const criteriaQ = $(tr).find("td.PAGROUPDIVIDER");
    const spanQ = $(tr).find("span.PSLONGEDITBOX");
    const lis = $(tr).find("li");
    if (criteriaQ.length > 0) {
      retCriteria.name = getInnerText(criteriaQ[0]);
    } else if (lis.length > 0) {
      retCriteria = lis
        .toArray()
        .reduce((prev, li) => ({ ...prev, ...processLi(li) }), retCriteria);
    } else if (spanQ.length > 0) {
      retCriteria = { ...retCriteria, ...processDescriptions(spanQ[0]) };
    }
  });
  return retCriteria;
};

/**
 *
 * @param {cheerio} courseTable table.PSLEVEL4GRIDNBO
 */
const mapTableToCourses = courseTable => {
  const coursesTrs = $(courseTable).find("tr");
  const keys = cheerio(coursesTrs[0])
    .find("th")
    .toArray()
    .map(getInnerText)
    .map(s => (!!s ? s.toLowerCase() : s));
  return coursesTrs
    .toArray()
    .filter(tr =>
      getInnerText(cheerio(tr).find("td")[0]).match(/[A-Z]{4}\d+\w*/g)
    )
    .map(tr =>
      cheerio(tr)
        .find("td")
        .toArray()
        .reduce(
          (prev, currv, k) => ({
            ...prev,
            [keys[k]]: (keys[k] === "units" ? Number : String)(
              getInnerText(currv)
            )
          }),
          {}
        )
    );
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
 * @param {cheerio} span span.PSLONGEDITBOX
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
    if ($(span).find("b").length > 0) {
      satisfied = $(span)
        .find("b")
        .toArray()
        .reduce((prev, b) => {
          if (getInnerText(b).indexOf("Not Satisfied") !== -1) {
            return null;
          }
          return prev;
        }, satisfied);
    }
  } else {
    satisfied = null;
  }
  return { satisfied, descriptions };
};

module.exports = main;
