const cheerio = require("cheerio");

// const requirementGroupTableClass = 'PSGROUPBOXWBO'

const getInnerText = element => {
  if(!element)return ''
  if(!element.children && element.type==='text')return element.data
  if(element.children.length ===0) return ''
  return element.children.reduce((prev,currv)=>prev+getInnerText(currv),'')
  // if(!element) return "ignored";
  //   var str = '';
  //   for(var i=0; i<element.children.length; i++){
  //     if(element.type !=)
  //       if(element.children[i]&&element.children[i].data) str += element.children[i].data
  //       else str += '|';
  //   }
  //   return str;
};

const obtainArJSON = arHTML => {
  const $ = cheerio.load(arHTML);
  const requirementGroupTables = $(".PSGROUPBOXWBO").toArray();
  const requirements = requirementGroupTables.map(obtainGroupObject);
  return requirements;
};

const obtainGroupObject = groupTable => {
  const $ = cheerio(groupTable)
  const labelTd = $.find(".PSGROUPBOXLABEL")[0];
  const labelText = getInnerText(labelTd).replace(/\s+/g,' ')
  const contentTable = $.find('.PABACKGROUNDINVISIBLE')[0]
  const descriptionSpan = cheerio(contentTable).find('span.PSLONGEDITBOX')[0]
  const groupDescriptionText = getInnerText(descriptionSpan).replace(/\s+/g,' ')
  const areaTable = cheerio(contentTable).find('table.PSLEVEL1SCROLLAREABODYNBO[id="SAA_ARSLT_RLVW$scroll$1"]').find('table')[0]
  // console.log(labelTd.children())
  return {
    label:labelText,
    description:groupDescriptionText,
    areaRows: cheerio(cheerio(areaTable).find('tbody')[0]).children('tr').length
  };
};

module.exports = obtainArJSON;
