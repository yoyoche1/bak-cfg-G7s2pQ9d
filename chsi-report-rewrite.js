
const FIELD_RULES = {
  学校名称: "北京大学",
  层次: "本科",
  专业: "智能科学与技术",
  学制: "4 年",
  学历类别: "普通高等教育",
  学习形式: "普通全日制",
  分院: "",
  系所: "多智能体",
  入学日期: "2025年08月31日",
  学籍状态: "在籍（注册学籍）",
  预计毕业日期: "2029年07月01日",
  在线验证码: "ABQZT79APECU017Q",

};


const TEXT_RULES = [

];


const MASK_ENABLE = false;
const MASK_FIELDS = ["在线验证码"]; 


const PROTECTED_FIELDS = [];


function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


function buildRegexes(label) {
  const L = escapeRegExp(label);
  return [
    new RegExp(
      '(<div class="label">\\s*' + L + '\\s*</div>\\s*<div class="value[^"]*">)([^<]*)(</div>)'
    ),
    new RegExp(
      '(<span class="text">\\s*' + L + '\\s*</span>\\s*<span class="yzm">)([^<]*)(</span>)'
    ),
    new RegExp(
      '(<div class="col-left">\\s*' + L + '\\s*</div>\\s*<div class="col-right[^"]*">)([^<]*)(</div>)'
    )
  ];
}


function replaceField(html, label, newValue) {
  const res = buildRegexes(label);
  let total = 0;
  let out = html;
  for (let i = 0; i < res.length; i++) {
    out = out.replace(res[i], function (match, open, value, close) {
      total += 1;
      return open + newValue + close;
    });
  }
  return { html: out, hit: total };
}


function maskText(text) {
  const s = String(text);
  if (s.length <= 2) return "*".repeat(s.length);
  return s[0] + "*".repeat(s.length - 2) + s[s.length - 1];
}

function maskField(html, label) {
  const res = buildRegexes(label);
  let total = 0;
  let out = html;
  for (let i = 0; i < res.length; i++) {
    out = out.replace(res[i], function (match, open, value, close) {
      total += 1;
      return open + maskText(value) + close;
    });
  }
  return { html: out, hit: total };
}

function main() {
  const resp = $response;
  if (!resp || typeof resp.body !== "string" || resp.body.length === 0) {
    console.log("[CHSI] 响应体为空，跳过改写");
    $done({});
    return;
  }

  let html = resp.body;
  let changed = 0;

  
  Object.keys(FIELD_RULES).forEach(function (label) {
    if (PROTECTED_FIELDS.indexOf(label) !== -1) {
      console.log("[CHSI] 字段受保护，已跳过：" + label);
      return;
    }
    const r = replaceField(html, label, FIELD_RULES[label]);
    if (r.hit > 0) {
      html = r.html;
      changed += 1;
      console.log("[CHSI] 已替换字段 " + label + " -> " + FIELD_RULES[label]);
    } else {
      console.log("[CHSI] 未匹配到字段：" + label);
    }
  });


  TEXT_RULES.forEach(function (pair) {
    if (html.indexOf(pair[0]) !== -1) {
      html = html.split(pair[0]).join(pair[1]);
      changed += 1;
      console.log("[CHSI] 已替换文本 " + pair[0] + " -> " + pair[1]);
    }
  });


  if (MASK_ENABLE) {
    MASK_FIELDS.forEach(function (label) {
      const r = maskField(html, label);
      if (r.hit > 0) {
        html = r.html;
        changed += 1;
        console.log("[CHSI] 已打码字段：" + label);
      }
    });
  }

  console.log("[CHSI] 完成，命中 " + changed + " 项");
  $done({ body: html });
}

main();
