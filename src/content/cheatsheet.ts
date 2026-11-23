export interface CheatsheetTip {
  id: string;
  title: string;
  paragraphs: string[];
  code?: string;
}

export interface CheatsheetGroup {
  id: string;
  title: string;
  tips: CheatsheetTip[];
}

export const cheatsheetGroups: CheatsheetGroup[] = [
  {
    id: "sql",
    title: "SQL",
    tips: [
      {
        id: "sql-ctes",
        title: "CTEs: WITH",
        paragraphs: [
          "One `WITH` introduces comma-separated named queries. Include a CTE in `FROM` or `JOIN` to access its columns.",
        ],
        code: `WITH a AS (SELECT COUNT(*) AS n FROM source_a),
     b AS (SELECT COUNT(*) AS n FROM source_b)
SELECT a.n, b.n FROM a CROSS JOIN b;`,
      },
      {
        id: "sql-mysql-string-lengths",
        title: "MySQL: string length",
        paragraphs: [
          "`CHAR_LENGTH` counts characters; `LENGTH` counts bytes. MySQL has no `LEN` function.",
        ],
        code: "SELECT CHAR_LENGTH(text_col), LENGTH(text_col) FROM records;",
      },
      {
        id: "sql-union-ordering",
        title: "UNION: duplicates and result ordering",
        paragraphs: [
          "`UNION` removes duplicate rows; `UNION ALL` preserves them. Guarantee combined order with an outer `ORDER BY` and explicit sort keys. A branch-local `ORDER BY`/`LIMIT` requires parentheses in MySQL; those parentheses do not order the combined result.",
        ],
        code: `SELECT value FROM (
  SELECT value, 1 AS sort_key FROM source_a
  UNION ALL
  SELECT value, 2 AS sort_key FROM source_b
) AS combined
ORDER BY sort_key, value;`,
      },
      {
        id: "sql-mysql-concat",
        title: "MySQL: CONCAT()",
        paragraphs: [
          "`CONCAT` joins strings; `+` performs numeric addition and can coerce strings to numbers. Any NULL argument makes the result NULL; use `COALESCE` for an intended replacement.",
        ],
        code: "SELECT CONCAT(first_name, ' ', COALESCE(last_name, '')) FROM people;",
      },
      {
        id: "sql-hierarchy-node-types",
        title: "Hierarchy: classify root, inner, leaf",
        paragraphs: [
          "A row with `parent IS NULL` is a root; a node that appears as another row's parent is internal; any other node is a leaf. Filter NULLs inside `IN`/`NOT IN` subqueries, because `NOT IN` with a NULL can return no rows. A self-join can duplicate rows, so use `IN`/`EXISTS` when only testing existence.",
        ],
        code: `SELECT id,
  CASE
    WHEN parent IS NULL THEN 'Root'
    WHEN id IN (SELECT parent FROM tree WHERE parent IS NOT NULL) THEN 'Inner'
    ELSE 'Leaf'
  END AS node_type
FROM tree;`,
      },
      {
        id: "sql-count-parents-children",
        title: "Counting entities across detail tables",
        paragraphs: [
          "Use `COUNT(DISTINCT id)` when duplicate rows or repeated relationships can occur. Start from the parent table with `LEFT JOIN` and wrap counts in `COALESCE(count, 0)` so parents without children remain; `INNER JOIN` drops them. Alternatively aggregate each child table separately before joining, which avoids multiplying rows.",
        ],
        code: `SELECT p.id, COALESCE(c.n, 0) AS child_count
FROM parents p
LEFT JOIN (
  SELECT parent_id, COUNT(DISTINCT id) AS n
  FROM children
  GROUP BY parent_id
) c ON c.parent_id = p.id;`,
      },
      {
        id: "sql-mysql-replace",
        title: "MySQL: REPLACE and REGEXP_REPLACE",
        paragraphs: [
          "`REPLACE(string, from, to)` substitutes every occurrence of an exact substring; case sensitivity depends on collation. Nest calls for multiple substitutions. MySQL 8 adds `REGEXP_REPLACE(col, pattern, replacement)` for patterns. `SELECT` does not modify stored data; use `UPDATE` only intentionally.",
          "`REPLACE` works on strings, so numeric input is converted first. Quote string arguments, and cast back if a number is needed. `CEIL` rounds up, `FLOOR` rounds down, and `ROUND` rounds to nearest.",
        ],
        code: `SELECT REPLACE(phone, '-', '') FROM customers;
SELECT CAST(REPLACE(CAST(n AS CHAR), '0', '') AS UNSIGNED) FROM nums;`,
      },
      {
        id: "sql-primary-natural-surrogate-keys",
        title: "Primary, natural, and surrogate keys",
        paragraphs: [
          "Primary key: chosen unique, non-NULL identifier, possibly composite. Natural key: business-derived. Surrogate key: artificial, such as an auto-increment ID or UUID. Either kind can be primary; check uniqueness, nullability, and stability.",
        ],
      },
      {
        id: "sql-distinct-vs-unique",
        title: "DISTINCT vs. UNIQUE",
        paragraphs: [
          "`DISTINCT` deduplicates selected rows; `UNIQUE` constrains stored values. Both apply to complete column combinations. MySQL permits multiple NULLs in a nullable UNIQUE column; DISTINCT on that column returns one NULL.",
        ],
        code: "SELECT DISTINCT column_a, column_b FROM records;",
      },
      {
        id: "sql-vowels-at-both-ends",
        title: "MySQL: string boundaries and pattern matching",
        paragraphs: [
          "`LEFT`/`RIGHT` extract string boundaries. In `LIKE`, `%` matches zero or more characters and `_` matches one. Case sensitivity depends on collation; `LOWER` normalizes case.",
        ],
        code: `LEFT(text_col, 1)
RIGHT(text_col, 1)
text_col LIKE 'prefix%'
LOWER(text_col) IN ('value_a', 'value_b')`,
      },
      {
        id: "sql-mysql-median",
        title: "MySQL 8+: median with window functions",
        paragraphs: [
          "MySQL has no native `MEDIAN` aggregate. Rank non-NULL values and average the middle one or two positions.",
        ],
        code: `WITH ranked AS (
  SELECT value, ROW_NUMBER() OVER (ORDER BY value) AS rn,
         COUNT(*) OVER () AS n
  FROM samples WHERE value IS NOT NULL
)
SELECT AVG(value) FROM ranked
WHERE rn IN (FLOOR((n + 1) / 2), FLOOR((n + 2) / 2));`,
      },
      {
        id: "sql-case-triangles",
        title: "CASE: first matching condition wins",
        paragraphs: [
          "`CASE` returns one value per row. The first true `WHEN` wins, so put more specific conditions first. Omitting `ELSE` returns NULL for unmatched rows.",
        ],
        code: `CASE
  WHEN condition_a THEN result_a
  WHEN condition_b THEN result_b
  ELSE default_result
END`,
      },
      {
        id: "sql-group-by-having",
        title: "GROUP BY and HAVING",
        paragraphs: [
          "`GROUP BY` groups rows sharing values so aggregates such as `COUNT`, `SUM`, and `AVG` are computed per group. `WHERE` filters input rows before grouping; `HAVING` filters groups afterward, often using aggregate conditions.",
        ],
        code: `SELECT department, COUNT(*) AS n
FROM employees
WHERE active = 1
GROUP BY department
HAVING COUNT(*) >= 5;`,
      },
      {
        id: "sql-gaps-and-islands",
        title: "Gaps and islands: consecutive IDs",
        paragraphs: [
          "For unique integer IDs, filter eligible rows first, then compute the expression below: the difference stays constant within each consecutive-ID run. `GROUP BY grp HAVING COUNT(*) >= k` selects qualifying run keys; join those keys back to ranked rows to return every record in those runs. Missing/excluded IDs break runs. Consecutive dates need date-aware arithmetic; do not `PARTITION BY id`.",
        ],
        code: `id - ROW_NUMBER() OVER (ORDER BY id) AS grp`,
      },
      {
        id: "sql-lag-lead",
        title: "LAG and LEAD: neighboring rows",
        paragraphs: [
          "`LAG` reads earlier rows; `LEAD` reads later rows in window order. Offset defaults to 1. Ordered neighbors need not have consecutive IDs: check ID differences explicitly. For unique integer IDs, next IDs at +1/+2, neighbors at -1/+1, or previous IDs at -1/-2 identify every member of runs of at least three, with no upper bound: each row belongs to a consecutive triple. Filter eligibility before computing windows.",
        ],
        code: `LAG(col, offset) OVER (ORDER BY key)
LEAD(col, offset) OVER (ORDER BY key)`,
      },
      {
        id: "sql-mysql-pivot",
        title: "MySQL 8+: pivot with conditional aggregation",
        paragraphs: [
          "MySQL has no native PIVOT. Number rows within each category, then group matching positions. CASE routes labels into columns; MAX selects each column's sole non-NULL label. Window ordering sorts each list; missing cells remain SQL NULL.",
        ],
        code: `WITH ranked AS (
  SELECT label, category,
         ROW_NUMBER() OVER (PARTITION BY category ORDER BY label) AS rn
  FROM records
)
SELECT MAX(CASE WHEN category = 'A' THEN label END) AS a,
       MAX(CASE WHEN category = 'B' THEN label END) AS b
FROM ranked GROUP BY rn ORDER BY rn;`,
      },
      {
        id: "sql-indexing-vs-partitioning",
        title: "Indexing vs. partitioning",
        paragraphs: [
          "Indexes accelerate row lookup and sometimes sorting. Partitioning divides a table; pruning skips irrelevant partitions. Combine them when useful, and align partition keys with filtering or retention needs.",
        ],
      },
      {
        id: "sql-database-sharding",
        title: "Database sharding",
        paragraphs: [
          "Horizontally distributes rows across independent database nodes by a shard key, such as user_id. Scales storage/writes and can isolate workloads, but complicates routing, rebalancing, cross-shard joins/transactions, and hot keys. Choose a stable, high-cardinality, well-distributed key aligned with access patterns. Table partitioning subdivides data within a database system; sharding distributes it across independent nodes. Indexing, scale-up, or partitioning may suffice.",
        ],
      },
    ],
  },
  {
    id: "python",
    title: "Python",
    tips: [
      {
        id: "python-list-instance",
        title: "List instances, append, and extend",
        paragraphs: [
          "`[]` or `list()` creates an instance. Assigning `list` stores the type and can cause a descriptor error when used as an instance. `append` adds one item; `extend` consumes an iterable.",
        ],
        code: `items = []
items.append(value)
items.extend(values)`,
      },
      {
        id: "python-nested-list-traversal",
        title: "Nested iteration with enumerate",
        paragraphs: [
          "Nested iteration handles ragged rows; `enumerate` adds indexes. Visiting an m-by-n matrix takes O(m*n) time and O(1) auxiliary space when processing values without collecting results.",
        ],
        code: `for i, row in enumerate(matrix):
    for j, value in enumerate(row):
        print(i, j, value)`,
      },
      {
        id: "python-matrix-dimensions",
        title: "Matrix dimensions",
        paragraphs: [
          "`len(matrix)` counts rows; `len(matrix[0])` counts the first row's columns. Guard empty input. Ragged rows can have different lengths.",
        ],
        code: `rows = len(matrix)
first_row_columns = len(matrix[0]) if matrix else 0`,
      },
      {
        id: "python-square-matrix-diagonals",
        title: "Square matrix diagonals",
        paragraphs: [
          "For an n-by-n square matrix, the main diagonal uses `matrix[i][i]`; the other uses `matrix[i][n - 1 - i]`. Iterate `i` over `range(n)`.",
        ],
        code: `n = len(matrix)
main = sum(matrix[i][i] for i in range(n))
other = sum(matrix[i][n - 1 - i] for i in range(n))`,
      },
      {
        id: "python-dict-complexity",
        title: "dict: hash-table complexity",
        paragraphs: [
          "Python's built-in `dict` uses a hash table: lookup, update, and deletion average O(1); insertion is amortized O(1). A resize can make one insertion O(n); pathological collisions can make operations O(n). Key hashing/equality costs also matter. Balanced-tree maps typically provide O(log n) operations. Space is O(n) for n entries, including table capacity/overhead; counting the full reachable object graph adds key/value memory costs.",
        ],
      },
      {
        id: "python-perfect-square-factors",
        title: "Perfect squares and factor pairs",
        paragraphs: [
          "A positive integer has an odd number of positive factors exactly when it is a perfect square: the square-root factor pairs with itself. `math.isqrt` avoids floating-point square-root precision limits.",
        ],
        code: `import math
root = math.isqrt(n)
is_square = root * root == n`,
      },
    ],
  },
  {
    id: "data-engineering",
    title: "Data engineering",
    tips: [
      {
        id: "de-pyspark-session",
        title: "PySpark: SparkSession and CSV input",
        paragraphs: [
          "`SparkSession` is the entry point for DataFrame and Spark SQL APIs. `getOrCreate()` reuses a suitable existing session or creates one. For local practice, optionally add `.master(\"local[*]\")` before `getOrCreate()`; production master settings usually come from deployment or `spark-submit`. Databricks notebooks and the `pyspark` shell normally provide `spark` already.",
        ],
        code: `from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("Practice").getOrCreate()
df = spark.read.option("header", True).csv("data.csv")`,
      },
      {
        id: "de-spark-ml-features",
        title: "Spark ML: DataFrames and features",
        paragraphs: [
          "`pyspark.ml` provides DataFrame-based APIs and distributed algorithms such as logistic regression, random forests, and k-means. Features generally occupy one numeric vector column assembled with `VectorAssembler`. Encode categorical inputs with `StringIndexer` and `OneHotEncoder` as appropriate for the algorithm.",
        ],
      },
      {
        id: "de-spark-ml-pipelines",
        title: "Spark ML: pipelines and evaluation",
        paragraphs: [
          "`Transformer.transform()` returns a DataFrame; `Estimator.fit()` learns a model that is a Transformer. `Pipeline` chains stages; `Pipeline.fit()` returns a `PipelineModel`. Split before fitting learned preprocessing: fit the pipeline on training data, then transform test data. Use task-appropriate metrics and chronological/group splits when random splits would leak information.",
        ],
      },
      {
        id: "de-databricks-ml-lifecycle",
        title: "Databricks: ML lifecycle",
        paragraphs: [
          "Databricks combines managed Spark/data workflows with MLflow experiment tracking for parameters, metrics, and model artifacts, Unity Catalog model registration/governance, and Model Serving deployment where supported. MLflow tracks work; training algorithms learn the model.",
        ],
      },
      {
        id: "de-distributed-ml",
        title: "Distributed vs. single-machine ML",
        paragraphs: [
          "Spark distributes data processing and supported ML algorithms. Arbitrary Python or scikit-learn training is not automatically distributed. Prefer simple single-machine training when data and training fit comfortably within its resources; use distributed training when scale justifies the coordination overhead.",
        ],
      },
      {
        id: "de-functional-requirements",
        title: "Functional requirements: In, Change, Out",
        paragraphs: [
          "In: sources and ingestion. Change: validation, transformation, deduplication, and schema handling. Out: destinations and consumers. These define what the pipeline must do.",
        ],
      },
      {
        id: "de-nonfunctional-scale",
        title: "Nonfunctional requirements: SCALE",
        paragraphs: [
          "Size: volume and growth. Correctness: quality and reconciliation. Availability: uptime and recovery. Latency: freshness. Economics: compute, storage, and retention costs. Also check security and monitoring; SCALE is a memory aid, not an exhaustive taxonomy.",
        ],
      },
      {
        id: "de-pipeline-interview-answer",
        title: "Pipeline layers and responsibilities",
        paragraphs: [
          "Ingestion lands replayable raw data; processing validates and transforms it; serving exposes curated outputs. Airflow orchestrates dependencies, retries, and backfills. Spark or AWS Glue can perform processing.",
        ],
        code: "Source -> Raw -> Curated -> Serving",
      },
      {
        id: "de-etl-vs-elt",
        title: "ETL vs. ELT",
        paragraphs: [
          "ETL suits pre-load masking/validation or limited target compute; ELT uses lake/warehouse compute for scalable, evolving analytics and raw-data reprocessing. Choose by transformation location, allowed data boundaries, cost/scale, and freshness. Both support batch, streaming, and hybrids. ELT still needs ingestion validation, access controls, and retention; ETL can keep a separate governed raw landing area.",
        ],
        code: `ETL: Extract -> Transform -> Load target
ELT: Extract -> Load target -> Transform`,
      },
      {
        id: "de-lake-warehouse-lakehouse",
        title: "Lake vs. warehouse vs. lakehouse",
        paragraphs: [
          "Lakes typically use low-cost object storage for varied files, raw retention, ML, and reprocessing; potentially inconsistent data needs cataloging, validation, and governance. Warehouses emphasize curated, modeled data and optimized SQL for BI and consistent metrics, with ingestion/modeling effort and platform costs. Lakehouses add table transactions, governance, and SQL analytics to lake storage. Schema enforcement, compute separation, and costs depend on the platform.",
        ],
      },
      {
        id: "de-fact-table-grain",
        title: "Dimensional modeling: keep one grain per fact table",
        paragraphs: [
          "Do not mix grains in one fact table. When a parent line item and its exploded child components differ in grain, model separate facts (for example `fact_line_item` and `fact_line_item_component`) linked by the parent key, or use a bridge or allocation fact when a shared parent value must be spread across children.",
          "Summing a parent measure after joining to its children double counts. Keep additive measures at their natural grain and allocate explicitly when children must roll up. Rows with the same grain and consistent measures belong in one fact table.",
        ],
      },
      {
        id: "de-flatten-normalize-allocate",
        title: "Terms: flatten, normalize, allocate",
        paragraphs: [
          "Breaking nested or array JSON into rows is called flattening, unnesting, or exploding: Spark `explode()`, SQL `UNNEST` or `LATERAL FLATTEN`, depending on the engine.",
          "Normalization splits data into related tables. Allocation distributes a parent measure across its children.",
        ],
      },
      {
        id: "de-schema-evolution",
        title: "Schema evolution: reader direction matters",
        paragraphs: [
          "Backward: new readers read old data. Forward: old readers read new data. Use versioned contracts and compatibility checks. Avro reader defaults can fill added fields in old records. Parquet evolution depends on the reader; prefer additive nullable columns and test mixed versions.",
        ],
      },
      {
        id: "de-batch-streaming-cdc",
        title: "Batch vs. streaming vs. CDC",
        paragraphs: [
          "Batch processes bounded input; streaming consumes ongoing events. CDC captures database inserts, updates, and deletes and can feed either mode. A scheduled batch can be incremental.",
        ],
      },
      {
        id: "de-cdc-use-cases",
        title: "CDC: snapshot, changes, and replay",
        paragraphs: [
          "CDC supports replication, index/cache synchronization, and migration catch-up. Coordinate the initial snapshot and change log; handle duplicates, ordering, retries, schema changes, and retention. Timestamp-based extraction needs explicit delete tracking.",
        ],
        code: "Database -> Debezium -> Kafka -> Consumers",
      },
      {
        id: "de-delta-table-files",
        title: "Delta table storage",
        paragraphs: [
          "Delta typically stores Parquet files plus `_delta_log`. Versions identify active files; older files can remain for retained snapshots. Deletion vectors mark removed rows without immediate rewrites, so read through Delta metadata rather than scanning every file.",
        ],
      },
      {
        id: "de-delta-vacuum",
        title: "Delta VACUUM",
        paragraphs: [
          "Removes eligible obsolete/unreferenced data files after retention (default 7 days). Preserves current data; compaction and log cleanup are separate. Retention must cover readers, writers, and stream lag. Keep safety checks enabled: removing needed files breaks historical reads and recovery. DRY RUN lists candidates.",
        ],
        code: `VACUUM table_name DRY RUN;
VACUUM table_name;`,
      },
      {
        id: "de-delta-optimize",
        title: "Delta OPTIMIZE",
        paragraphs: [
          "Compacts small files and applies configured clustering without changing logical query results. Replaced files can remain until eligible for VACUUM.",
        ],
        code: "OPTIMIZE table_name;",
      },
      {
        id: "de-delta-time-travel-restore",
        title: "Delta time travel and history",
        paragraphs: [
          "Historical reads require transaction history and referenced data files within runtime retention rules. Typical defaults: 30-day log retention, 7-day deleted-file retention. A history entry alone cannot guarantee an available snapshot.",
        ],
        code: `DESCRIBE HISTORY table_name;
SELECT * FROM table_name VERSION AS OF 42;`,
      },
      {
        id: "de-delta-restore",
        title: "Delta RESTORE",
        paragraphs: [
          "Publishes an earlier available snapshot as the current state through a new commit. Requires retained files; RESTORE cannot recover data already removed by VACUUM.",
        ],
        code: "RESTORE TABLE table_name TO VERSION AS OF 42;",
      },
      {
        id: "de-delta-zorder",
        title: "Delta ZORDER",
        paragraphs: [
          "Colocates related values for better file skipping on compatible non-liquid-clustered tables. It is a layout technique, not a B-tree index. Cannot combine with liquid clustering.",
        ],
        code: "OPTIMIZE table_name ZORDER BY (column_name);",
      },
      {
        id: "de-databricks-liquid-clustering",
        title: "Databricks liquid clustering",
        paragraphs: [
          "Organizes data by evolving clustering keys; OPTIMIZE applies the layout. Databricks recommends it for new supported tables. Requires compatible runtime/table features and cannot coexist with partitioning or ZORDER.",
        ],
      },
      {
        id: "de-delta-data-skipping",
        title: "Delta data skipping",
        paragraphs: [
          "Per-file statistics such as min/max eliminate files that cannot match a filter. Clustering makes ranges more selective; candidate files still need row-level filtering.",
        ],
      },
      {
        id: "de-delta-merge",
        title: "Delta MERGE INTO",
        paragraphs: [
          "Applies matched updates, inserts, and optional deletes, commonly for CDC. Match at the intended row grain, deduplicate source keys, and enforce source-version ordering so replays cannot overwrite newer state.",
        ],
      },
      {
        id: "de-delta-change-data-feed",
        title: "Delta Change Data Feed (CDF)",
        paragraphs: [
          "Exposes Delta row changes to incremental downstream readers; database-log CDC captures upstream changes. Enable with `delta.enableChangeDataFeed = true` when needed. Capture starts when enabled; track reader progress within retention.",
        ],
      },
      {
        id: "de-databricks-predictive-optimization",
        title: "Databricks predictive optimization",
        paragraphs: [
          "Can automate OPTIMIZE, VACUUM, and ANALYZE for eligible Unity Catalog managed tables. ANALYZE collects query-planning statistics. Check enablement and retain files long enough for recovery, active workloads, and stream lag.",
        ],
      },
    ],
  },
];

export function cheatsheetSearchText(group: CheatsheetGroup, tip: CheatsheetTip): string {
  return `${group.title} ${tip.title} ${tip.paragraphs.join(" ")} ${tip.code ?? ""}`.toLowerCase();
}
