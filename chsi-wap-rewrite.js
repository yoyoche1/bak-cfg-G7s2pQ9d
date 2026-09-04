
var SCHOOL = "北京大学";            // <div class="yxmc"> 学校名称
var LEVEL = "本科";                 // <div class="cc">   层次
var MAJOR = "智能科学与技术";       // <div class="des">  专业（前半段）
var STUDY_FORM = "普通全日制";      // <div class="des">  学习形式（后半段）


var LIST_RULES = {
  学制: "4 年",
  学历类别: "普通高等教育",
  分院: "",                 
  系所: "多智能体系",
  班级: "20250101",
  学号: "20251405000547",
  入学日期: "2025年08月31日",
  学籍状态: "在籍（注册学籍）",
  预计毕业日期: "2029年07月01日",

};



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


  var css = "<style>.yxmc,.cc,.des,.gdjy-view-ul li .right{font-family:Chsi,\"PingFang SC\",\"Hiragino Sans GB\",\"Microsoft YaHei\",sans-serif!important;}</style>";
  html = html.replace(/<\/head>/, css + "</head>");

  $done({ body: html });
}

main();
