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
    name: "test-browser-donations",
    enforce: "pre",
    transform(code, id) {
      if (id.endsWith("/src/lib/donations.ts") || id.endsWith("/src/lib/progress.ts")) {
        return code.replaceAll("import.meta.env.SSR", "false");
      }
    },
  }],
});
after(() => server.close());
const { courses } = await server.ssrLoadModule("/src/content/index.ts");
const { initDonationPrompts } = await server.ssrLoadModule("/src/lib/donations.ts");
const { markVisited, markCourseCompleted, resetProgress } = await server.ssrLoadModule("/src/lib/progress.ts");
const progressKey = "de-crash-course-progress";
const milestoneKey = "de-crash-course-donation-milestones";
const markers = courses.flatMap(course => course.topics.map(topic => `${course.id}/${topic.id}`));

function installDOM({ count, shown, values = new Map(), consentOpen = false, searchOpen = false, failRead = false, failWrite = false } = {}) {
  const { window, document } = parseHTML(`<html><body>
    <button id="reading-control">Continue reading</button>
    <footer><a id="venmo-support" href="https://venmo.com/tarunrajnish">
    <span class="venmo-logo" aria-hidden="true">
    <img src="/de-crash-course/assets/venmo-v.svg" alt="">
    </span><span>Support via Venmo</span></a>
    <p id="donation-status" hidden></p></footer>
    <section id="analytics-consent" hidden></section>
  </body></html>`);
  const names = ["window", "document", "localStorage", "MutationObserver"];
  const previous = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  if (count !== undefined) values.set(progressKey, JSON.stringify(markers.slice(0, count)));
  if (shown !== undefined) values.set(milestoneKey, JSON.stringify(shown));
  const observers = [];
  class Observer {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
  }
  const storage = {
    getItem: name => {
      if (failRead && name === milestoneKey) throw new Error("Storage cannot be read");
      return values.get(name) ?? null;
    },
    setItem: (name, value) => {
      if (failWrite && name === milestoneKey) throw new Error("Storage cannot be saved");
      values.set(name, value);
    },
    removeItem: name => { values.delete(name); },
  };
  for (const [name, value] of Object.entries({ window, document, localStorage: storage, MutationObserver: Observer })) {
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  document.getElementById("analytics-consent").hidden = !consentOpen;
  if (searchOpen) document.body.classList.add("search-open");
  return {
    window, document, values,
    popup: () => document.getElementById("donation-popup"),
    flushObservers: () => observers.forEach(observer => observer.callback()),
    restore() {
      for (const [name, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
        else delete globalThis[name];
      }
    },
  };
}

test("normal reminders use exact overall thresholds at 25, 50, 75, and 100 percent", () => {
  for (const milestone of [25, 50, 75, 100]) {
    const minimum = Math.ceil(markers.length * milestone / 100);
    const previous = [25, 50, 75, 100].filter(value => value < milestone);
    for (const count of [minimum - 1, minimum]) {
      const dom = installDOM({ count, shown: previous });
      try {
        initDonationPrompts(false);
        assert.equal(dom.popup().hidden, count < minimum, `${count}/${markers.length} for ${milestone}%`);
        if (count === minimum) {
          assert.equal(dom.document.getElementById("donation-popup-title").textContent, `You've reached ${milestone}%`);
          assert.deepEqual(JSON.parse(dom.values.get(milestoneKey)), [...previous, milestone]);
        } else {
          assert.deepEqual(JSON.parse(dom.values.get(milestoneKey)), previous);
        }
      } finally {
        dom.restore();
      }
    }
  }
});

test("the default test preview returns on each reload without changing milestone history or progress", () => {
  const values = new Map([[milestoneKey, JSON.stringify([25, 50, 75, 100])]]);
  for (let reload = 0; reload < 2; reload++) {
    const dom = installDOM({ count: 0, values });
    try {
      const before = new Map(values);
      initDonationPrompts();
      assert.equal(dom.popup().hidden, false);
      assert.match(dom.popup().textContent, /Test preview: shown on every reload/);
      assert.equal(dom.document.getElementById("donation-popup-title").textContent, "Found this useful?");
      const link = dom.popup().querySelector("a");
      assert.equal(link.href, dom.document.getElementById("venmo-support").href);
      assert.equal(link.getAttribute("target"), "_blank");
      assert.equal(link.getAttribute("rel"), "noopener noreferrer");
      assert.equal(link.querySelector(".venmo-logo").getAttribute("aria-hidden"), "true");
      assert.deepEqual(
        [...link.querySelectorAll(".venmo-logo img")].map(image => image.getAttribute("src")),
        [...dom.document.querySelectorAll("#venmo-support .venmo-logo img")].map(image => image.getAttribute("src")),
      );
      const close = dom.popup().querySelector("button");
      assert.equal(close.getAttribute("aria-label"), "Dismiss donation reminder");
      assert.equal(close.textContent, "");
      assert.ok(close.querySelector('svg[aria-hidden="true"] path'));
      close.click();
      assert.equal(dom.popup().hidden, true);
      dom.flushObservers();
      initDonationPrompts();
      assert.equal(dom.popup().hidden, true);
      assert.equal(dom.document.querySelectorAll("#donation-popup").length, 1);
      assert.deepEqual(values, before);
    } finally {
      dom.restore();
    }
  }
});

test("jumping across milestones shows only the highest and preserves dismissals after progress resets", () => {
  const values = new Map();
  const dom = installDOM({ count: markers.length, values });
  try {
    initDonationPrompts(false);
    assert.equal(dom.document.getElementById("donation-popup-title").textContent, "You've reached 100%");
    assert.deepEqual(JSON.parse(values.get(milestoneKey)), [25, 50, 75, 100]);
    dom.popup().querySelector("button").click();
    resetProgress();
    assert.equal(values.has(progressKey), false);
    assert.deepEqual(JSON.parse(values.get(milestoneKey)), [25, 50, 75, 100]);
    assert.equal(dom.popup().hidden, true);
  } finally {
    dom.restore();
  }
  const returned = installDOM({ count: markers.length, values });
  try {
    initDonationPrompts(false);
    assert.equal(returned.popup().hidden, true);
  } finally {
    returned.restore();
  }
});

test("reminders defer for consent and search, and dismissal prevents reopening on the same page", () => {
  const dom = installDOM({ count: markers.length, consentOpen: true, searchOpen: true });
  try {
    initDonationPrompts(false);
    assert.equal(dom.popup().hidden, true);
    assert.equal(dom.values.has(milestoneKey), false);
    dom.document.getElementById("analytics-consent").hidden = true;
    dom.flushObservers();
    assert.equal(dom.popup().hidden, true);
    dom.document.body.classList.remove("search-open");
    dom.flushObservers();
    assert.equal(dom.popup().hidden, false);
    dom.document.body.classList.add("search-open");
    dom.flushObservers();
    assert.equal(dom.popup().hidden, true);
    dom.document.body.classList.remove("search-open");
    dom.flushObservers();
    assert.equal(dom.popup().hidden, false);
    dom.popup().querySelector("button").click();
    dom.flushObservers();
    assert.equal(dom.popup().hidden, true);
  } finally {
    dom.restore();
  }
});

test("saved lesson and bulk completion changes trigger reminders without a reload", () => {
  const minimum = Math.ceil(markers.length / 4);
  const dom = installDOM({ count: minimum - 1 });
  try {
    initDonationPrompts(false);
    assert.equal(dom.popup().hidden, true);
    const [courseId, topicId] = markers[minimum - 1].split("/");
    markVisited(courseId, topicId);
    assert.equal(dom.popup().hidden, false);
    assert.equal(dom.document.getElementById("donation-popup-title").textContent, "You've reached 25%");
  } finally {
    dom.restore();
  }
  const half = Math.ceil(markers.length / 2);
  const bulk = installDOM({ count: half - 1, shown: [25] });
  try {
    initDonationPrompts(false);
    assert.equal(bulk.popup().hidden, true);
    markCourseCompleted(courses[courses.length - 1]);
    assert.equal(bulk.popup().hidden, false);
    assert.equal(bulk.document.getElementById("donation-popup-title").textContent, "You've reached 50%");
  } finally {
    bulk.restore();
  }
});

test("unreadable, invalid, or unsavable milestone history reports failure without altering progress", () => {
  for (const options of [{ failRead: true }, { failWrite: true }, { shown: [26] }]) {
    const dom = installDOM({ count: markers.length, ...options });
    const previousError = console.error;
    const errors = [];
    console.error = (...args) => errors.push(args);
    try {
      const before = new Map(dom.values);
      initDonationPrompts(false);
      assert.equal(dom.popup().hidden, true);
      assert.equal(dom.document.getElementById("donation-status").hidden, false);
      assert.equal(errors.length, 1);
      assert.ok(dom.document.getElementById("venmo-support"));
      assert.deepEqual(dom.values, before);
      dom.flushObservers();
      assert.equal(errors.length, 1);
    } finally {
      console.error = previousError;
      dom.restore();
    }
  }
});
