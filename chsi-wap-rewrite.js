/*
 * Loon / Surge 响应改写脚本 —— 学信档案「手机端学籍详情页」文字本地替换
 *
 * 脚本类型：http-response
 * 匹配目标：https://my.chsi.com.cn/archive/wap/gdjy/xj/detail.action?id=...
 *
 * ── 重要说明（字体混淆）──────────────────────────
 * 这个页面和 www.chsi.com.cn 不同：所有字段值都被做成了「字体混淆」，
 * HTML 里存的是 PUA 私有区字符（如 􅙥􆟮 ），靠一个叫 Chsi 的 webfont 还原成汉字。
 * 所以不能靠「匹配原文文字」来定位，只能靠「标签名 / class」定位。
 * 替换成普通汉字后，浏览器会用 Chsi 之后的兜底字体渲染（Chsi 里没有这些普通码位的字形）。
 * ────────────────────────────────────────────────
 */

// ===== 1. 顶部卡片区：学校名称 / 层次 / 专业 + 学习形式 =====
var SCHOOL = "北京大学";            // <div class="yxmc"> 学校名称
var LEVEL = "本科";                 // <div class="cc">   层次
var MAJOR = "智能科学与技术";       // <div class="des">  专业（前半段）
var STUDY_FORM = "普通全日制";      // <div class="des">  学习形式（后半段）

// ===== 2. 下方列表区：按左侧标签名替换（值原本也是 PUA）=====
var LIST_RULES = {
  学制: "4 年",
  学历类别: "普通高等教育",
  分院: "",                 // 保持空白
  系所: "多智能体",
  班级: "20250101",
  学号: "20251405000547",
  入学日期: "2025年08月31日",
  学籍状态: "在籍（注册学籍）",
  预计毕业日期: "2029年07月01日",
  // 民族、证件号码 不动；姓名/性别/出生日期在顶部卡片，也不动
};

// ==================== 实现，一般不用改 ====================

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

  // 学校名称
  html = tryReplace(html, /(<div class="yxmc">)[^<]*(<\/div>)/, "$1" + SCHOOL + "$2", "学校名称");
  // 层次
  html = tryReplace(html, /(<div class="cc[^"]*">)[^<]*(<\/div>)/, "$1" + LEVEL + "$2", "层次");
  // 专业 | 学习形式
  html = tryReplace(html, /(<div class="des">)[^<]*(<\/div>)/, "$1" + MAJOR + "　|　" + STUDY_FORM + "$2", "专业/学习形式");

  // 列表字段
  Object.keys(LIST_RULES).forEach(function (label) {
    var re = new RegExp('(<div class="left">\\s*' + esc(label) + '\\s*</div>\\s*<div class="right">)[^<]*(</div>)');
    html = tryReplace(html, re, "$1" + LIST_RULES[label] + "$2", "列表-" + label);
  });

  // 注入字体规则：字体名保持原来的 Chsi，补兜底字体让明文汉字正常显示
  var css = "<style>.yxmc,.cc,.des,.gdjy-view-ul li .right{font-family:Chsi,\"PingFang SC\",\"Hiragino Sans GB\",\"Microsoft YaHei\",sans-serif!important;}</style>";
  html = html.replace(/<\/head>/, css + "</head>");

  $done({ body: html });
}

main();
