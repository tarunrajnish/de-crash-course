import type { Topic } from "../types";

export const jobStageTask: Topic = {
  id: "job-stage-task",
  glossary: ["Job", "Stage", "Task", "Action", "Shuffle"],
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
    {
      heading: "Visual example: total sales per customer",
      paragraphs: [
        "Filter positive sales with `sales.filter(\"amount > 0\")`, then chain `.groupBy(\"customer\")`, `.sum(\"amount\")`, and `.collect()`. The filter and aggregation build a plan; `collect()` requests the result. Assume three input partitions, three shuffle partitions, and a simple execution without adaptive changes, extra planning jobs, or retries.",
        "Job 0 contains two stages. Stage 0 runs three tasks, one for each input partition, to read, filter, and produce partial customer totals. The shuffle redistributes those totals by customer, so all partial totals for a customer reach the same downstream partition.",
        "Stage 1 runs three more tasks, one for each shuffle partition, to fetch the shuffled data and finish the totals. Six tasks are scheduled across the two stages; the downstream stage waits for the required shuffle output, and available executor cores limit how many tasks run at once.",
        "The task count can change between stages: three input partitions and two shuffle partitions would produce three tasks followed by two tasks, for five in total. Retries can add task attempts; Spark UI counts can differ when adaptive execution or extra jobs are involved.",
      ],
      diagram: {
        src: "assets/job-stage-task.svg",
        alt: "One collect action creates Job 0. Inside the job, Stage 0 has tasks 0, 1, and 2 for input partitions P0, P1, and P2. A shuffle routes matching customer keys into three downstream partitions. Stage 1 has tasks 3, 4, and 5 for those shuffle partitions. The example has two stages and six tasks in total.",
        caption: "One job contains two stages separated by a shuffle. Each stage has three partitions and three tasks in this example.",
      },
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
    {
      question: "A two-stage job has three input partitions and two shuffle partitions. Without retries, how many tasks run?",
      answer: "Five: three tasks in the first stage and two in the second. Count the partitions separately for each stage; the stages do not have to have the same task count.",
    },
  ],
};
