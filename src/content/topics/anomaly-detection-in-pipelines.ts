import type { Topic } from "../types";

export const anomalyDetectionInPipelines: Topic = {
  id: "anomaly-detection-in-pipelines",
  glossary: ["Standard deviation", "Seasonality", "Isolation forest", "Multivariate", "Alert fatigue"],
  title: "Anomaly detection on pipeline metrics",
  shortDescription: "Threshold checks versus statistical models for catching row count, null rate, and distribution shifts, and why simpler usually wins.",
  sections: [
    {
      heading: "Hardcoded thresholds",
      paragraphs: [
        "The simplest anomaly check is a fixed rule: alert if row count drops below 1 million, or if the null rate on email exceeds 5%. These are fast to write, trivial to reason about, and fail in an obvious, debuggable way: anyone reading the check knows exactly what condition triggered it.",
        "Their weakness is that they don't adapt to legitimate change. A table with real day-of-week seasonality (weekday volume is double weekend volume) needs either a much looser threshold that misses real weekday anomalies, or a per-day threshold that someone has to maintain by hand as the business grows.",
      ],
    },
    {
      heading: "Statistical and threshold-on-history approaches",
      paragraphs: [
        "A step up from a fixed number is a threshold computed from the table's own recent history: alert if today's row count is more than N standard deviations from the trailing 30-day mean, or outside a seasonally-adjusted band that accounts for day-of-week. This captures the table's normal variability without a human hand-tuning a number per table.",
        "This is still fundamentally a threshold check; it's just computing the threshold from data instead of a config file. It remains interpretable (you can show someone the 30-day chart and the band) and doesn't require a training pipeline, a model registry, or ongoing retraining, which is most of the appeal.",
      ],
    },
    {
      heading: "Where ML-based anomaly detection earns its complexity",
      paragraphs: [
        "ML-based approaches (isolation forests, seasonal decomposition with learned parameters, more elaborate time-series models) can catch subtler multivariate anomalies: a combination of metrics that are each individually unremarkable but jointly unusual. They're worth the investment for high-value tables with complex, multi-seasonal patterns and a team with the bandwidth to maintain a model in production.",
        "For most teams and most tables, this complexity isn't earned. A model needs retraining as patterns legitimately shift, needs monitoring of its own to know when it's degraded, and produces anomaly scores that are harder to explain to an on-call engineer at 2 a.m. than \"row count is 60% below the 30-day average.\" The operational cost of maintaining the model often exceeds the cost of the false positives a simpler threshold would have produced.",
      ],
    },
    {
      heading: "Alert fatigue is the real failure mode",
      paragraphs: [
        "A monitoring system that is too sensitive doesn't fail by missing incidents; it fails by training the on-call rotation to ignore it. Once a team learns that most alerts on a given check are noise, they stop investigating promptly, and the one alert that mattered gets the same five-minutes-later glance as the ninety that didn't.",
        "This is why a looser, well-tuned threshold check that pages rarely and reliably is often operationally superior to a tighter or more sophisticated check that pages often and unreliably, even if the tighter check is technically catching more true anomalies. The goal of the monitoring system isn't maximum sensitivity, it's sustained trust from the people who have to respond to it.",
      ],
      warning:
        "A team that silences or auto-acknowledges an alert channel because it pages too often has, in effect, turned off monitoring while still paying for it.",
    },
  ],
  example: {
    title: "A weekend dip is normal; a Monday collapse is not",
    description: "Illustrative expected bands account for day-of-week. A global minimum of 90,000 rows would incorrectly alert on both weekend runs.",
    table: {
      headers: ["Day", "Rows", "Expected band", "Decision"],
      rows: [
        ["Friday", "99,000", "90,000-110,000", "Normal"],
        ["Saturday", "40,000", "35,000-45,000", "Normal"],
        ["Sunday", "41,000", "35,000-45,000", "Normal"],
        ["Monday", "20,000", "90,000-110,000", "Alert"],
      ],
    },
    takeaway: "Compare each run with a relevant baseline. Accounting for seasonality reduces predictable false positives while preserving the alert on Monday's unexpected drop.",
  },
  selfTest: [
    {
      question: "Why does a fixed row-count threshold often misfire on a table with strong day-of-week seasonality?",
      answer:
        "A single fixed number can't account for the normal difference between, for example, weekday and weekend volume. Setting it loose enough to avoid false alarms on weekends means it misses real anomalies on weekdays, and tight enough for weekdays means it pages every weekend.",
    },
    {
      question: "How does a threshold computed from trailing history (e.g. mean plus N standard deviations over 30 days) improve on a hardcoded number, without being full ML anomaly detection?",
      answer:
        "It adapts automatically to the table's own recent normal behavior instead of requiring a human to hand-tune and maintain a fixed number, while remaining a simple, interpretable statistical calculation rather than a trained model that needs retraining and separate monitoring of its own.",
    },
    {
      question: "When does the added complexity of ML-based anomaly detection actually pay off?",
      answer:
        "On high-value tables with complex, multi-seasonal, or multivariate patterns that simple thresholds can't represent, and when the team has the ongoing bandwidth to retrain, monitor, and explain the model's behavior. For most tables, the operational overhead exceeds the benefit over a well-tuned statistical threshold.",
    },
    {
      question: "What is alert fatigue, and why is it worse than simply missing some anomalies?",
      answer:
        "Alert fatigue is when frequent low-value alerts train responders to deprioritize or ignore a channel. It's worse than missing some anomalies because it degrades the response to every alert on that channel, including the rare one that is a genuine, high-impact incident.",
    },
    {
      question: "A team silences an alert channel because it pages too often. What has actually happened to their monitoring coverage?",
      answer:
        "Monitoring coverage has effectively dropped to zero for that channel even though the checks are still technically running; no one is acting on their output, so a real incident on that channel will go undetected just as if the checks didn't exist.",
    },
    {
      question: "Why might a simpler, less sensitive threshold check be operationally superior to a more sophisticated one that catches more true anomalies?",
      answer:
        "If the more sensitive check pages often enough to erode trust, responders start ignoring or delaying investigation on all of its alerts, including true positives. A less sensitive check that pages rarely and reliably sustains the behavior the monitoring system depends on: prompt investigation every time it fires.",
    },
  ],
};
