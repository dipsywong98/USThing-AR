const cheerio = require("cheerio");

// const requirementGroupTableClass = 'PSGROUPBOXWBO'

const getInnerText = (element,d=0) => {
  if (!element) return "";
  if (element.name === 'img'){
    if(element.attribs.src.match('PS_CS_CREDIT_TAKEN_ICN_1.gif')){
      return 'Taken'
    } else if (element.attribs.src.match('PS_CS_COURSE_ENROLLED_ICN_1.gif')){
      return 'In Progress'
    } else if(element.attribs.src.match('PS_CS_COURSE_PLANNED_ICN_1.gif')){
      return 'Planned'
    } else {
      return ''
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
    (prev, currv) => prev + getInnerText(currv,d+1),
    ""
  );
  if(d===0)return innertext.replace(/\s+/g,' ')
  return innertext
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

const not = fn => (...params) => !fn(...params);

const printTrs = (trs,x) => {
  console.log(x,trs.map(g=>getInnerText(g)))
}

const obtainArJSON = arHTML => {
  const $ = cheerio.load(arHTML);
  const requirementGroupTables = $(".PSGROUPBOXWBO").toArray();
  // const requirements = [
  //   obtainGroupObject(requirementGroupTables[0]),
  //   obtainGroupObject(requirementGroupTables[1])
  // ];
  const requirements = requirementGroupTables.map(obtainGroupObject);
  return requirements;
};

const obtainGroupObject = groupTable => {
  const $ = cheerio(groupTable);
  const labelTd = $.find(".PSGROUPBOXLABEL")[0];
  const labelText = getInnerText(labelTd).replace(/\s+/g, " ");
  const contentTable = $.find(".PABACKGROUNDINVISIBLE")[0];
  const descriptionSpan = cheerio(contentTable).find("span.PSLONGEDITBOX")[0];
  const groupDescriptionText = getInnerText(descriptionSpan).replace(
    /\s+/g,
    " "
  );
  const areaTable = cheerio(
    cheerio(contentTable).find("table.PSLEVEL1SCROLLAREABODYNBO")[0]
  ).find("tbody")[0];
  // console.log('+++++++++++++++++++++++++++++')
  // console.log(getInnerText(areaTable).replace(/\s+/g,' '))//.toString())
  // console.log('-----------------')
  // console.log(cheerio(areaTable).toString().replace(/\s{2+}/g,'\n'))
  const areaTrs = cheerio(areaTable)
    .children("tr")
    .toArray()
    .filter(tr => !isPlaceholderTr(tr));
  // const filteredareaTrs = areaTrs.filter((tr)=>!isPlaceholderTr(tr))
  // console.log(getInnerText(areaTrs[1]).replace(/\s+/g,' '))
  // console.log('equivalent',getInnerText(areaTrs).replace(/\s+/g,' ')==getInnerText(filteredareaTrs).replace(/\s+/g,' '))
  // console.log(areaTrs.reduce((prev,currv)=>prev+'\n'+getInnerText(currv).replace(/\s+/g,' '),''))
  const areas = clusterTrsIntoAreas(areaTrs).map(processArea);
  // console.log(areas.map(c => c.length));
  

  // const areasWithSubgroups = areas.map(clusterAreaIntoSubgroups);
  // console.log(areasWithSubgroups.map(c => c.map(cc => cc.length)));
  
  // console.log(areasWithSubgroups.reduce((prev,c)=>prev+'\n---------\n'+c.reduce((prevc,cc)=>prevc+'\n'+getInnerText(cc), ''), ''))
  // console.log((''+cheerio(areasWithSubgroups[0][1])).replace(/                                                                                  /g,'  '))
  
  // const overview = processSubgroup(areasWithSubgroups[0])
  // const areas = areasWithSubgroups.splice(1).map(processSubgroup)
  
  // console.log(labelTd.children())
  return {
    label: labelText,
    description: groupDescriptionText,
    areaRows: areaTrs.length,
    overview:areas[0],
    areas:areas.splice(1)
  };
};

/**
 * 
 * @param {array of Tr} areaTrs 
 * @return {array of array of Tr} 
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

const processArea = area => {
  const groups = clusterAreaIntoSubgroups(area)
  console.log(groups.map(g=>g.length))
  if(groups.length === 0)return {}
  printTrs(groups[0],'groups')
  const overview = processOverview(groups[0])
  const details = groups.splice(1).map(processOverview)
  // const details = groups.splice(1).map()
  // const overview = (groups.length>0 && processGroup(groups[0])) || ''
  // const details = (groups.length>0 && groups.splice(1)).map(processGroup)
  console.log({overview,details})
  return {
    overview,
    details
  }
}

const clusterAreaIntoSubgroups = areaTrs => {
  return areaTrs.reduce(
    (prev, currv) => {
      const $ = cheerio(currv);
      if ($.find(".SSSTEXTDKBLUEBOLD10").length > 0) {
        prev.push([currv]);
      } else {
        prev[prev.length - 1].push(currv);
      }
      return prev;
    },
    [[]]
  );
};

const processOverview = trs => {
  printTrs(trs, 'process overview')
  let description
  let units
  let label
  let title
  let courses
  trs.forEach(tr=>{
    const $ = cheerio(tr)
    const descriptionSpan = $.find('span.PSLONGEDITBOX')
    if(descriptionSpan.length > 0){
      description = getInnerText(descriptionSpan[0])
    }
    const unitsLi = $.find('li')
    if(unitsLi.length > 0){
      units = getInnerText(unitsLi[0]).match(/\d+\.*\d*/g)
      if(units){
        units = {
          required: units[0],
          taken: units[1],
          needed: units[2]
        }
      }
    }
    // const labelTd = $.find('td.PAGROUPDIVIDER')
    const labelTd = $.find('td.SSSTEXTDKBLUEBOLD10')
    if(labelTd.length > 0){
      label = getInnerText(labelTd[0])
    }

    const titleTd = $.find('td.PAGROUPDIVIDER')
    if(titleTd.length > 0){
      title = getInnerText(titleTd[0])
    }
    // console.log(getInnerText(tr))

    let courseTable = $.find('table.PSLEVEL4GRIDLEFTFRAME')
    if(courseTable.length > 0){
      courseTable = courseTable.find('table.PSLEVEL4GRIDNBO')
      const coursesTrs = courseTable.find('tr')
      const keys = cheerio(coursesTrs[0]).find('th').toArray().map(getInnerText)
      courses = coursesTrs.toArray().filter(tr=>
        getInnerText(cheerio(tr).find('td')[0]).match(/[A-Z]{4}\d+\w*/g)
      ).map(tr=>
        cheerio(tr).find('td').toArray().reduce((prev,currv,k)=>({
        ...prev,
        [keys[k]]:getInnerText(currv)
      }),{}))
    }
  })
  console.log({title})
  return {title,label,description,units,courses}
}

const processGroup = subgroupTrs => {
  console.log(subgroupTrs.map(g=>getInnerText(g)))
  return 
}

module.exports = obtainArJSON;
