// ============= 配置区：只改这 7 个字段，其他全部不动 =============

// 列表字段（明文标签，值在 {{...}} 占位符）—— 只改这 5 个
var LIST_RULES = {
  学制: "4 年",
  班级: "20250101",
  学号: "20251405000547",
  入学日期: "2025年08月31日",
  学籍状态: "在籍（注册学籍）",
  // 不动的：学校名称、层次、专业、学习形式、学历类别、分院、系所、民族、证件号码、姓名、性别、出生日期
};

// 「离校日期/预计毕业日期」字段：标签和值都在 JSON 里
// byrq = 日期值，byrqItemName = 标签名
var BYRQ_VALUE = "2029年07月01日";       // 日期改成这个
var BYRQ_ITEMNAME = "预计毕业日期";      // 标签统一显示成这个（把「离校日期」改掉）

// ==================== 实现 ====================

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

  // 顶部卡片（学校/层次/专业/学习形式）—— 本版不处理，跳过

  // 列表字段：只改 LIST_RULES 里的 5 个明文标签
  Object.keys(LIST_RULES).forEach(function (label) {
    var re = new RegExp('(<div class="left">\\s*' + esc(label) + '\\s*</div>\\s*<div class="right">)[^<]*(</div>)');
    html = tryReplace(html, re, "$1" + LIST_RULES[label] + "$2", "列表-" + label);
  });

  // 「离校日期/预计毕业日期」字段：直接改 JSON 数据
  // 1) 日期值（两种状态都改）
  html = tryReplace(html, /"byrq":"[^"]*"/, '"byrq":"' + BYRQ_VALUE + '"', "JSON-离校日期值");
  // 2) 标签名：只在「离校日期」状态时存在，改成「预计毕业日期」
  html = tryReplace(html, /"byrqItemName":"离校日期"/, '"byrqItemName":"' + BYRQ_ITEMNAME + '"', "JSON-离校日期标签");

  // 注入字体兜底，让列表右值的明文汉字能正常显示（不走 Chsi webfont 的项）
  var css = "<style>.gdjy-view-ul li .right{font-family:Chsi,\"PingFang SC\",\"Hiragino Sans GB\",\"Microsoft YaHei\",sans-serif!important;}</style>";
  html = html.replace(/<\/head>/, css + "</head>");

  $done({ body: html });
}

main();
