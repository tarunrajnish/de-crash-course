import type { Topic } from "../types";

export const jobStageTask: Topic = {
  id: "job-stage-task",
  title: "Jobs, stages, and tasks",
  shortDescription: "How Spark breaks one line of code into the units of work that actually run on a cluster.",
  sections: [
    {
      heading: "Job",
      paragraphs: [
        "A job is created every time your code triggers an action, something that forces Spark to actually produce a result (write, count, collect) rather than just describe a transformation.",
        "Transformations alone (select, filter, join) don't run anything; they build up a plan. The action is what fires that plan.",
      ],
    },
    {
      heading: "Stage",
      paragraphs: [
        "A job is split into stages at every shuffle boundary, a point where data must be redistributed across the cluster (for a join or groupBy, for example).",
        "Everything inside one stage can run without talking to other partitions; everything that requires repartitioning data starts a new stage.",
      ],
    },
    {
      heading: "Task",
      paragraphs: [
        "A stage is split into tasks, one per partition. A task is the actual unit of work an executor runs: it applies the stage's operations to one partition's worth of data.",
        "If a stage has 200 partitions, it has 200 tasks, and those tasks run in parallel across however many executor cores are available.",
      ],
    },
  ],
  selfTest: [
    {
      question: "What triggers a new job?",
      answer: "An action: an operation that forces Spark to produce a concrete result, such as write, count, or collect. Transformations alone only build a plan.",
    },
    {
      question: "What causes a job to split into multiple stages?",
      answer: "A shuffle boundary, a point where data needs to be redistributed across the cluster, such as for a join or a groupBy.",
    },
    {
      question: "If a stage has 400 partitions, how many tasks does it have?",
      answer: "400. One task per partition in that stage.",
    },
  ],
};
