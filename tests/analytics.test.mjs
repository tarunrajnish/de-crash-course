import { after, test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { parseHTML } from "linkedom";

const server = await createServer({
  mode: "production",
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
  logLevel: "error",
  plugins: [{
    name: "test-production-analytics",
    enforce: "pre",
    transform(code, id) {
      if (id.endsWith("/src/lib/analytics.ts")) return code.replaceAll("import.meta.env.PROD", "true");
    },
  }],
});
after(() => server.close());
const { initAnalytics } = await server.ssrLoadModule("/src/lib/analytics.ts");
const key = "de-crash-course-analytics-consent";
const measurementId = "G-Y4ZYTKJ10V";
const disabled = `ga-disable-${measurementId}`;
const site = new URL(JSON.parse(server.config.define["import.meta.env.VITE_SITE_URL"]));

function installDOM({ saved = null, failRead = false, failWrite = false, origin = site.origin } = {}) {
  const { window, document } = parseHTML(`<html><head></head><body>
    <button id="analytics-preferences" hidden>Privacy &amp; analytics</button>
    <p id="analytics-status" hidden></p>
  </body></html>`);
  const names = ["window", "document", "localStorage", "location", "dataLayer", disabled];
  const previous = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const values = new Map(saved ? [[key, saved]] : []);
  let reloads = 0;
  const location = {
    origin, hostname: new URL(origin).hostname, pathname: site.pathname,
    reload: () => { reloads++; },
  };
  const storage = {
    getItem: name => {
      if (failRead) throw new Error("Storage blocked");
      return values.get(name) ?? null;
    },
    setItem: (name, value) => {
      if (failWrite) throw new Error("Storage blocked");
      values.set(name, value);
    },
  };
  for (const [name, value] of Object.entries({ window, document, localStorage: storage, location, dataLayer: undefined, [disabled]: undefined })) {
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  Object.defineProperty(window, "location", { configurable: true, value: location });
  const cookies = new Map();
  Object.defineProperty(document, "cookie", {
    configurable: true,
    get: () => [...cookies].map(([name, value]) => `${name}=${value}`).join("; "),
    set: text => {
      const [name, value] = text.split(";")[0].split("=");
      if (text.includes("Max-Age=0")) cookies.delete(name);
      else cookies.set(name, value);
    },
  });
  return {
    window, document, values, cookies,
    get reloads() { return reloads; },
    commands: () => (window.dataLayer ?? []).map(command => Array.from(command)),
    restore() {
      for (const [name, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
        else delete globalThis[name];
      }
    },
  };
}

test("first visits and declined consent never create a Google tag or command queue", () => {
  for (const saved of [null, "declined"]) {
    const dom = installDOM({ saved });
    try {
      initAnalytics();
      assert.equal(dom.document.querySelector("#analytics-consent").hidden, saved !== null);
      assert.equal(dom.document.querySelector("#analytics-preferences").hidden, false);
      assert.equal(dom.document.querySelector("script"), null);
      assert.equal(dom.window.dataLayer, undefined);
      dom.document.querySelector('[aria-label="Decline analytics"]').click();
      assert.equal(dom.values.get(key), "declined");
      assert.equal(dom.document.querySelector("script"), null);
      assert.equal(dom.reloads, 0);
      initAnalytics();
      assert.equal(dom.document.querySelectorAll("#analytics-consent").length, 1);
    } finally {
      dom.restore();
    }
  }
});

test("accepting loads the direct GA4 tag once with analytics granted and advertising disabled", () => {
  const dom = installDOM();
  try {
    initAnalytics();
    dom.document.querySelector('[aria-label="Accept analytics"]').click();
    const script = dom.document.querySelector("#analytics-tag");
    assert.equal(script.getAttribute("src"), `https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
    assert.equal(script.async, true);
    assert.equal(dom.values.get(key), "accepted");
    assert.equal(dom.document.querySelector("#analytics-consent").hidden, true);
    const commands = dom.commands();
    assert.deepEqual(commands[0].slice(0, 2), ["consent", "default"]);
    assert.equal(commands[0][2].analytics_storage, "denied");
    const update = commands.find(command => command[0] === "consent" && command[1] === "update");
    assert.equal(update[2].analytics_storage, "granted");
    assert.ok(commands.findIndex(command => command[0] === "set") < commands.indexOf(update),
      "Cookie settings must precede the consent grant");
    for (const field of ["ad_storage", "ad_user_data", "ad_personalization"]) {
      assert.equal(update[2][field], "denied");
    }
    const config = commands.find(command => command[0] === "config");
    assert.equal(config[1], measurementId);
    assert.equal(config[2].allow_google_signals, false);
    assert.equal(config[2].allow_ad_personalization_signals, false);
    assert.equal(config[2].cookie_path, site.pathname);
    assert.equal(config[2].cookie_prefix, "de_crash_course");
    assert.equal(config[2].cookie_domain, "none");
    dom.document.querySelector("#analytics-preferences").click();
    dom.document.querySelector('[aria-label="Accept analytics"]').click();
    assert.equal(dom.document.querySelectorAll("#analytics-tag").length, 1);
    assert.equal(dom.commands().filter(command => command[0] === "config").length, 1);
  } finally {
    dom.restore();
  }
});

test("saved acceptance loads once; withdrawal removes only analytics cookies and preserves learning data", () => {
  const dom = installDOM({ saved: "accepted" });
  try {
    dom.values.set("de-crash-course-progress", '["spark-delta-basics/job-stage-task"]');
    dom.values.set("de-crash-course-theme", "light");
    for (const name of ["de_crash_course_ga", "de_crash_course_ga_Y4ZYTKJ10V", "_ga", "unrelated"]) {
      dom.cookies.set(name, "value");
    }
    initAnalytics();
    assert.ok(dom.document.querySelector("#analytics-tag"));
    assert.equal(dom.document.querySelector("#analytics-consent").hidden, true);
    dom.document.querySelector("#analytics-preferences").click();
    assert.equal(dom.document.querySelector("#analytics-consent").hidden, false);
    dom.document.querySelector('[aria-label="Decline analytics"]').click();
    assert.equal(dom.values.get(key), "declined");
    assert.equal(dom.window[disabled], true);
    assert.equal(dom.document.querySelector("#analytics-tag"), null);
    assert.equal(dom.reloads, 1);
    assert.deepEqual([...dom.cookies.keys()], ["_ga", "unrelated"]);
    assert.equal(dom.values.get("de-crash-course-progress"), '["spark-delta-basics/job-stage-task"]');
    assert.equal(dom.values.get("de-crash-course-theme"), "light");
  } finally {
    dom.restore();
  }
});

test("unreadable or unsavable consent fails closed and shows a useful error", t => {
  const log = t.mock.method(console, "error", () => {});
  for (const options of [{ saved: "accepted", failRead: true }, { failWrite: true }]) {
    const dom = installDOM(options);
    try {
      initAnalytics();
      if (options.failWrite) dom.document.querySelector('[aria-label="Accept analytics"]').click();
      assert.equal(dom.document.querySelector("#analytics-tag"), null);
      const message = dom.document.querySelector(".analytics-consent-error");
      assert.equal(message.hidden, false);
      assert.ok(message.textContent.includes("could not"));
    } finally {
      dom.restore();
    }
  }
  assert.equal(log.mock.calls.length, 2);
});

test("a blocked tag reports failure and an explicit retry does not duplicate page-view configuration", t => {
  const log = t.mock.method(console, "warn", () => {});
  const dom = installDOM({ saved: "accepted" });
  try {
    initAnalytics();
    dom.document.querySelector("#analytics-tag").dispatchEvent(new dom.window.Event("error"));
    assert.equal(dom.document.querySelector("#analytics-tag"), null);
    assert.equal(dom.window[disabled], true);
    assert.equal(dom.document.querySelector("#analytics-status").hidden, false);
    assert.equal(log.mock.calls.length, 1);
    dom.document.querySelector("#analytics-preferences").click();
    dom.document.querySelector('[aria-label="Accept analytics"]').click();
    assert.equal(dom.document.querySelectorAll("#analytics-tag").length, 1);
    assert.equal(dom.commands().filter(command => command[0] === "config").length, 1);
  } finally {
    dom.restore();
  }
});

test("withdrawal in another tab disables the current page and reloads it", () => {
  const dom = installDOM({ saved: "accepted" });
  try {
    initAnalytics();
    dom.values.set(key, "declined");
    const event = new dom.window.Event("storage");
    Object.assign(event, { key, newValue: "declined" });
    dom.window.dispatchEvent(event);
    assert.equal(dom.window[disabled], true);
    assert.equal(dom.reloads, 1);
  } finally {
    dom.restore();
  }
});

test("production previews on other origins never load analytics even with saved acceptance", () => {
  const dom = installDOM({ saved: "accepted", origin: "http://localhost:4174" });
  try {
    initAnalytics();
    assert.equal(dom.document.querySelector("script"), null);
    assert.equal(dom.document.querySelector("#analytics-consent"), null);
    assert.equal(dom.window.dataLayer, undefined);
    assert.equal(dom.document.querySelector("#analytics-preferences").hidden, true);
  } finally {
    dom.restore();
  }
});
