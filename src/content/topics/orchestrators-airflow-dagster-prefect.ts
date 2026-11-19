import type { Topic } from "../types";

export const orchestratorsAirflowDagsterPrefect: Topic = {
  id: "orchestrators-airflow-dagster-prefect",
  glossary: ["Airflow", "Dagster", "Prefect", "DAG", "Software-defined asset"],
  title: "Airflow, Dagster, and Prefect",
  shortDescription: "The three orchestrators you'll actually run into, and the task-based vs asset-based split underneath them.",
  sections: [
    {
      heading: "Airflow: the incumbent, task-based scheduler",
      paragraphs: [
        "Airflow models a pipeline as a DAG of tasks: each node is an operator (a bash command, a Python callable, a call to an external system), and edges are pure execution-order dependencies. Airflow doesn't inherently know or track what data each task produces; it only tracks whether the task succeeded or failed.",
        "This task-centric view is why Airflow is often described as 'imperative': the DAG describes a sequence of operations to run, not a declaration of what datasets should exist. It's also the reason Airflow has the largest ecosystem of integrations (providers) of the three, since a huge number of teams have been writing task-shaped DAGs against it since 2015.",
      ],
    },
    {
      heading: "Dagster: asset-based orchestration",
      paragraphs: [
        "Dagster's core abstraction is the software-defined asset: instead of declaring 'run function X after function Y', you declare 'this table/dataset depends on that table/dataset', and Dagster derives the execution DAG from those data dependencies automatically.",
        "This emerged as a direct reaction to task-based DAGs losing track of what data actually exists and whether it's up to date. In a pure task-based system, a task succeeding tells you the code ran without error, not that the resulting dataset is fresh, correct, or even that it was produced at all (a task can succeed while writing nothing, if its logic has a silent no-op branch). Dagster tracks materializations, so you can ask 'is this asset stale relative to its upstream' as a first-class question, not something you have to build yourself.",
      ],
    },
    {
      heading: "Prefect: lightweight, Python-native",
      paragraphs: [
        "Prefect's pitch is that orchestration logic should look like ordinary Python with decorators (@flow, @task) rather than a separate DSL or a set of operator classes to subclass. A Prefect flow is a Python function; the dependency graph falls out of normal function calls and return values, not an explicit DAG object you construct by hand.",
        "It targets teams that find Airflow's deployment model (DAG files synced to a scheduler, a metadata database, often a Kubernetes executor) heavier than they need, especially for smaller teams or pipelines that don't require Airflow's full provider ecosystem.",
      ],
    },
    {
      heading: "Comparing the three",
      paragraphs: [
        "None of these is strictly 'better'; they encode different bets about what the primary unit of orchestration should be: a task's execution order (Airflow), a dataset's freshness and lineage (Dagster), or a plain Python function call graph (Prefect).",
        "In practice, a team already deep in the Airflow ecosystem rarely migrates for asset-based orchestration alone; Dagster tends to win new, data-platform-first teams that want lineage and freshness tracking built in from day one rather than bolted on.",
      ],
      table: {
        caption: "Airflow vs Dagster vs Prefect",
        headers: ["Axis", "Airflow", "Dagster", "Prefect"],
        rows: [
          ["Core model", "Task-based DAG (execution order)", "Asset-based (data dependencies)", "Python function call graph"],
          ["Local dev experience", "Heavier: needs a scheduler + metadata DB running", "dagster dev spins up locally with a UI", "A decorated Python script runs directly"],
          ["Scheduling philosophy", "Fixed schedule intervals per DAG", "Freshness policies / asset sensors", "Flexible: cron, event triggers, or ad hoc"],
          ["Native freshness/lineage tracking", "Not built in, needs external tooling", "Built in (asset materializations)", "Not a primary focus"],
        ],
      },
    },
  ],
  example: {
    title: "One dependency graph, concrete data outputs",
    description: "A small orders pipeline produces three identifiable datasets, regardless of which orchestrator runs it.",
    steps: [
      { label: "Extract orders", detail: "Publish raw_orders version 17 with the source position." },
      { label: "Clean orders", detail: "Read raw v17, validate keys, and publish clean_orders v9." },
      { label: "Build daily revenue", detail: "Read clean v9, reconcile totals, and publish the reporting table." },
    ],
    takeaway: "Airflow can express the task dependencies, Dagster can declare the datasets as assets, and Prefect can coordinate the calls as a flow. Each still needs explicit freshness checks and retry-safe writes.",
  },
  selfTest: [
    {
      question: "In Airflow's model, what does a successful task actually guarantee?",
      answer:
        "Only that the task's code ran to completion without raising an error. It says nothing about what data was produced, whether it's correct, or whether anything was written at all; Airflow has no native concept of the dataset a task is supposed to produce.",
    },
    {
      question: "What is a software-defined asset in Dagster, and how does the execution DAG get derived from it?",
      answer:
        "A declaration that one dataset depends on another dataset. Dagster builds the execution order automatically from these data dependencies, rather than requiring the developer to hand-declare 'run this after that' the way a task-based DAG does.",
    },
    {
      question: "Why did asset-based orchestration emerge as a reaction to task-based DAGs specifically?",
      answer:
        "Task-based DAGs track task success/failure but not dataset state, so a team has no built-in way to answer 'is this dataset fresh' or 'what upstream data produced this table' without building that tracking themselves. Asset-based orchestration makes dataset freshness and lineage first-class instead of something bolted on.",
    },
    {
      question: "What's the core difference in how a Prefect flow's dependency graph is defined compared to Airflow's?",
      answer:
        "A Prefect flow is ordinary Python; the dependency graph falls out of function calls and their return values. Airflow requires explicitly constructing a DAG object and declaring task dependencies (e.g. with >> operators) rather than relying on plain function call structure.",
    },
    {
      question: "A team wants built-in freshness tracking for their tables without building it themselves. Which of the three is designed for that out of the box?",
      answer:
        "Dagster, because asset materializations and freshness policies are core, built-in concepts; Airflow and Prefect both require external tooling or custom code to track dataset freshness the same way.",
    },
  ],
};
