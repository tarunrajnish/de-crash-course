import type { Topic } from "../types";

export const schedulingVsEventDriven: Topic = {
  id: "scheduling-vs-event-driven",
  title: "Time-based scheduling vs event-driven triggering",
  shortDescription: "Two ways to decide when a pipeline runs, and why most real systems end up using both.",
  sections: [
    {
      heading: "Time-based scheduling",
      paragraphs: [
        "A time-based (cron-style) schedule runs a DAG at a fixed cadence: every hour, every day at 2 AM, every Monday. The orchestrator doesn't check whether the upstream data is actually ready; it just launches the DAG when the clock says to.",
        "This is simple and predictable: anyone can look at the schedule and know exactly when a pipeline will fire, which makes capacity planning and on-call expectations easy to reason about. The cost is that it assumes the upstream data is ready by that time, which is an assumption, not a guarantee.",
      ],
    },
    {
      heading: "Event-driven and sensor-based triggering",
      paragraphs: [
        "An event-driven DAG starts in response to something happening: a file landing in object storage, a message arriving on a queue, an upstream DAG completing. A sensor is the orchestrator-native version of this: a task that polls or waits for a condition (a file existing, a partition appearing in a table) before letting the rest of the DAG proceed.",
        "This gets you lower latency, the pipeline starts the moment data is actually available, instead of waiting for the next scheduled slot, and it removes the assumption that upstream will always finish by a fixed time. The cost is tighter coupling: the downstream pipeline now depends on the upstream system emitting a specific, reliable signal, and if that signal never fires (or fires with bad data), the downstream pipeline silently never runs, or runs on an empty precondition.",
      ],
    },
    {
      heading: "Choosing a default",
      paragraphs: [
        "Time-based scheduling is the right default when the upstream data has a reliable, well-known arrival time with margin to spare, think a nightly batch export that is reliably done by 1 AM, scheduled to run at 3 AM. The two-hour buffer absorbs normal variance without anyone needing to build triggering infrastructure.",
        "Event-driven triggering is the right default when latency actually matters to the business (a fraud-detection pipeline that needs to react within minutes of a transaction) or when upstream timing is unreliable enough that a fixed schedule would either run too early (processing incomplete data) or waste hours waiting past the actual completion time.",
      ],
      warning:
        "A fixed schedule set 'generously early' to be safe is a common failure that hides for a long time: the pipeline runs, finds a partially-written upstream partition, and either fails loudly (easy to catch) or quietly processes incomplete data (the dangerous version, because nothing errors).",
    },
    {
      heading: "Hybrid patterns",
      paragraphs: [
        "A very common real-world pattern combines both: a sensor waits for a specific upstream signal (a _SUCCESS file, a manifest, an upstream DAG's completion), and once that fires, it triggers a DAG whose internal structure and task logic look exactly like a normal scheduled pipeline. This gets the correctness guarantee of event-driven triggering (you only ever process after upstream confirms completion) with the operational simplicity of a schedule-shaped DAG underneath.",
        "The trade-off that doesn't go away is the sensor's own timeout and polling interval: a sensor waiting too long consumes a worker slot the whole time it polls (unless the orchestrator supports a non-blocking, 'reschedule' mode), and a sensor that times out too eagerly fails a run that would have succeeded five minutes later.",
      ],
    },
  ],
  videos: [{ title: "Airflow Sensors Explained", url: "https://www.youtube.com/watch?v=IH1-0hwFEz8" }],
  examplesToAttach: [
    "A DAG schedule interval alongside the actual, measured upstream completion times over a week, to show how much buffer the fixed schedule really has.",
    "A sensor configuration (poke interval, timeout, reschedule mode) and the reasoning for those specific values.",
  ],
  selfTest: [
    {
      question: "What assumption does a purely time-based schedule make, and what happens when that assumption is wrong?",
      answer:
        "It assumes upstream data is reliably ready by the scheduled time. When it isn't, the pipeline either fails against missing data (visible) or runs successfully against incomplete data (invisible and more dangerous, since nothing signals an error).",
    },
    {
      question: "What does a sensor do, mechanically, inside an orchestrated DAG?",
      answer:
        "It's a task that polls or waits for a condition, such as a file landing, a partition appearing, or an upstream DAG completing, and blocks the rest of the DAG from proceeding until that condition is met or a timeout is reached.",
    },
    {
      question: "Why does event-driven triggering introduce tighter coupling than time-based scheduling?",
      answer:
        "The downstream pipeline now depends on the upstream system reliably emitting a specific signal. If that signal format changes, stops firing, or fires on bad data, the downstream pipeline is directly affected, whereas a time-based schedule has no such dependency on an explicit signal.",
    },
    {
      question: "Describe the hybrid pattern that combines both approaches, and what it buys you.",
      answer:
        "A sensor waits for an upstream completion signal, then triggers a DAG that otherwise looks and behaves like a normal scheduled pipeline. It gets the correctness of only running after upstream confirms readiness, combined with the operational simplicity of a conventional, schedule-shaped DAG.",
    },
    {
      question: "What's the risk of a sensor with a poke interval and timeout that are both too generous?",
      answer:
        "Depending on the orchestrator's sensor mode, a 'poke' (blocking) sensor can occupy a worker slot for the entire wait window, wasting capacity, while a timeout set too short can fail a run that would otherwise have succeeded a few minutes later.",
    },
    {
      question: "Why is 'schedule it a couple hours later to be safe' a weak substitute for a real upstream signal?",
      answer:
        "It only works as long as upstream's actual completion time stays within that buffer. Any upstream slowdown that exceeds the buffer either causes a visible failure or, worse, lets the pipeline silently run against a partial write, with no mechanism that would catch either case automatically.",
    },
  ],
};
