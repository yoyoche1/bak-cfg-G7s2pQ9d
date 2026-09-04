
  


var LIST_RULES = {
  学制: "4 年",
  班级: "20250101",
  学号: "20251405000547",
  入学日期: "2025年08月31日",
  学籍状态: "在籍（注册学籍）",

};


var BYRQ_VALUE = "2029年07月01日";      
var BYRQ_ITEMNAME = "预计毕业日期";     



function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tryReplace(html, regex, replacement, tag) {
  if (regex.test(html)) {
    html = html.replace(regex, replacement);
    console.log("[CHSI-WAP] 已改 " + tag);
  } else {
    console.log("[CHSI-WAP] 未匹配 " + tag);
  }
  return html;
}

function main() {
  var resp = $response;
  if (!resp || typeof resp.body !== "string" || resp.body.length === 0) {
    console.log("[CHSI-WAP] 响应体为空，跳过");
    $done({});
    return;
  }
  var html = resp.body;

  
  html = tryReplace(html, /(<div class="yxmc">)[^<]*(<\/div>)/, "$1" + SCHOOL + "$2", "学校名称");

  html = tryReplace(html, /(<div class="cc[^"]*">)[^<]*(<\/div>)/, "$1" + LEVEL + "$2", "层次");

  html = tryReplace(html, /(<div class="des">)[^<]*(<\/div>)/, "$1" + MAJOR + "　|　" + STUDY_FORM + "$2", "专业/学习形式");


  Object.keys(LIST_RULES).forEach(function (label) {
    var re = new RegExp('(<div class="left">\\s*' + esc(label) + '\\s*</div>\\s*<div class="right">)[^<]*(</div>)');
    html = tryReplace(html, re, "$1" + LIST_RULES[label] + "$2", "列表-" + label);
  });


  html = tryReplace(html, /"byrq":"[^"]*"/, '"byrq":"' + BYRQ_VALUE + '"', "JSON-离校日期值");

  html = tryReplace(html, /"byrqItemName":"离校日期"/, '"byrqItemName":"' + BYRQ_ITEMNAME + '"', "JSON-离校日期标签");


  var css = "<style>.yxmc,.cc,.des,.gdjy-view-ul li .right{font-family:Chsi,\"PingFang SC\",\"Hiragino Sans GB\",\"Microsoft YaHei\",sans-serif!important;}</style>";
  html = html.replace(/<\/head>/, css + "</head>");

  $done({ body: html });
}

main();
