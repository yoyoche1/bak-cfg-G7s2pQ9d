/*
 * Loon / Surge 通用响应改写脚本 —— 学信网「学籍·学历·学位在线验证报告」页面文字本地替换
 *
 * 脚本类型：http-response
 * 匹配目标：https://www.chsi.com.cn/xlcx/bg.do?...
 *
 * ── 边界（务必看清）────────────────────────────────
 * 这个脚本只改「你自己的设备收到的那份 HTTP 响应」，
 * 学信网服务器上的原始数据一个字都没变，别人打开原链接看到的还是真实内容。
 * 合理用途：截图脱敏、本地演示、自测。
 * 越界用途：把改过的页面截图交给单位/学校/机构当作证明材料 ——
 *           那是伪造材料，会承担相应责任。别干。
 * ────────────────────────────────────────────────
 */

// ===== 1. 按字段名替换：左边是页面上显示的字段名，右边是要替换成的新值 =====
//      字段名必须和页面上的 label 完全一致，不想改的删掉或注释掉即可。
//      注意：页面上是「学历类别」，不是「学历类型」。
const FIELD_RULES = {
  学校名称: "北京大学",
  层次: "本科",
  专业: "智能科学与技术",
  学制: "4 年",
  学历类别: "普通高等教育",
  学习形式: "普通全日制",
  分院: "", // 原始页面本来就是空值，置空后保持空白（即使看起来没变化，也确保不会被别处填值）
  系所: "多智能体",
  入学日期: "2025年08月31日",
  学籍状态: "在籍（注册学籍）",
  预计毕业日期: "2029年07月01日",
  // 姓名、性别、出生日期、民族、在线验证码 —— 都不动
  // 姓名: "张三",
  // 性别: "男",
  // 出生日期: "2003年04月20日",
  // 民族: "汉族",
};

// ===== 2. 按字面量替换：页面里出现的所有该字符串都会被替换（不局限于字段值）=====
const TEXT_RULES = [
  // ["青岛理工大学", "示例大学"],
  // ["计算机科学与技术", "软件工程"],
];

// ===== 3. 脱敏开关 =====
//  true  = 在替换完成后，再把下面这些字段按 MASK_FIELDS 规则打码
//  false = 只做上面两段的替换
const MASK_ENABLE = false;
const MASK_FIELDS = ["在线验证码"]; // 需要打码的字段名

// ===== 4. 不要动的字段（改了会出问题，写了也会被跳过）=====
//  在线验证码：页面上的二维码是服务端按这个码生成的，
//              只改文字不改二维码，扫码验证时就会对不上，直接露馅。
const PROTECTED_FIELDS = ["在线验证码"];

// ==================== 以下是实现，一般不用改 ====================

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 页面里字段有几种写法，全部覆盖：
//   A. <div class="label">字段名</div> <div class="value">原值</div>          —— 报告主体（桌面版）
//   B. <span class="text">字段名</span> <span class="yzm">原值</span>         —— 底部在线验证码（桌面版）
//   C. <div class="col-left">字段名</div> <div class="col-right">原值</div>   —— 手机版（div.col-left + div.col-right）
//      注意：手机版姓名字段的 class 是 "col-right namtFamily"，所以 col-right 后面用 [^"]* 兼容。
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

// 把指定字段名后面的「原值」换掉
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

// 保留前 1 位 + 后 1 位，中间用 * 补到原长度
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

  // 1) 按字段名替换
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

  // 2) 按字面量替换
  TEXT_RULES.forEach(function (pair) {
    if (html.indexOf(pair[0]) !== -1) {
      html = html.split(pair[0]).join(pair[1]);
      changed += 1;
      console.log("[CHSI] 已替换文本 " + pair[0] + " -> " + pair[1]);
    }
  });

  // 3) 脱敏（即使字段受保护也允许打码，打码不会破坏验证逻辑以外的展示）
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
