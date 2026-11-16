import type { Topic } from "../types";

export const assertionBasedTesting: Topic = {
  id: "assertion-based-testing",
  title: "Assertion-based data testing",
  shortDescription: "Expectation frameworks like Great Expectations and dbt tests, and the difference between testing your code and testing your data.",
  sections: [
    {
      heading: "Two different things both called \"testing\"",
      paragraphs: [
        "A unit test on transformation logic checks that a function behaves correctly given known inputs: feed it a fixture with a null customer_id and a duplicate order_id, and assert the function handles both the way the code intends. This is identical in spirit to unit testing any other software and runs against fixtures, not production data.",
        "A data test (an assertion, in Great Expectations or dbt terms) checks a property of the actual data that flowed through the pipeline: are there nulls in a column that must never be null, are all values in a status column from the expected set, is a foreign key actually present in the parent table. The logic under test might be perfectly correct and the data can still fail these assertions, because the problem is upstream of the transformation, in the source data itself.",
      ],
    },
    {
      heading: "The common assertion vocabulary",
      paragraphs: [
        "dbt tests and Great Expectations expectations converge on a similar small vocabulary because most real data quality problems reduce to the same handful of shapes: not_null (a required column has no missing values), unique (a column or combination of columns has no duplicates), accepted_values (a column only contains values from a known set), and relationships (a foreign key column's values all exist in the referenced table's key column).",
        "Great Expectations has a much larger library (expect_column_values_to_match_regex, expect_column_mean_to_be_between, expect_table_row_count_to_be_between) that extends into distribution and volume checks, while dbt's built-in tests are narrower but trivially extensible with custom SQL-based generic tests, and both integrate with the models/tables they test rather than running as a separate, disconnected suite.",
      ],
    },
    {
      heading: "Where each kind of test lives in a pipeline",
      paragraphs: [
        "Unit tests on transformation logic belong in pre-merge CI: they run against small, static fixtures, execute in seconds, and should block a pull request before the code ever touches real data. They catch logic regressions (a changed join condition, an off-by-one in a window function) before deployment.",
        "Data tests belong in the pipeline itself, typically right after a load or transformation step, running against the actual data that step just produced. A not_null test on a load that just ran is checking this run's output, not a hypothetical one, which is why it can't be fully replaced by pre-merge CI: the data a test needs to see doesn't exist until the real pipeline runs.",
      ],
      warning:
        "Running only unit tests in CI and skipping data tests in production gives a team high confidence in code that has never been checked against the one thing it actually has to handle correctly: the real, messy, upstream data.",
    },
    {
      heading: "What a failed data test should actually do",
      paragraphs: [
        "A data test failing in production needs a decision, not just a log line: does it block downstream consumption (fail the pipeline, quarantine the batch) or does it warn and let data flow through anyway? dbt's severity config (error vs. warn) and Great Expectations' validation actions both exist because not every failed assertion should have the same blast radius.",
        "A reasonable default is to fail hard on assertions protecting primary keys and referential integrity, since downstream joins silently multiply or drop rows when those break, and to warn on softer distribution checks (a null rate creeping from 1% to 3%) that deserve investigation but shouldn't halt a pipeline serving dozens of downstream consumers over a borderline threshold.",
      ],
    },
  ],
  videos: [{ title: "Great Expectations: Data Quality for Data Engineers", url: "https://www.youtube.com/watch?v=_O0r2mctRQU" }],
  examplesToAttach: [
    "A dbt test result (schema.yml test definitions plus the run output) from one of your own models.",
    "A Great Expectations validation result (checkpoint output) showing a failed expectation and which rows triggered it.",
  ],
  selfTest: [
    {
      question: "A transformation's unit tests all pass, but a not_null data test fails on the same model in production. What does this tell you?",
      answer:
        "The transformation logic is behaving correctly against its known fixtures, but the real upstream data contains an unexpected null that those fixtures didn't cover. The problem is in the data, not the code, which unit tests can never detect because they never see real production data.",
    },
    {
      question: "Why can't a not_null or uniqueness data test be fully replaced by expanding the unit test fixture set?",
      answer:
        "The data a production data test checks is generated by the real pipeline run against real upstream sources, which changes over time. A fixture is static and can only encode scenarios someone already thought of; a data test catches scenarios no one anticipated, in the actual data as it arrives.",
    },
    {
      question: "Why should unit tests on transformation logic run in pre-merge CI rather than after deployment?",
      answer:
        "They run against small static fixtures in seconds and exist to catch logic regressions before the code is deployed. Running them pre-merge blocks a broken change before it reaches production, rather than discovering the regression after it has already affected real data.",
    },
    {
      question: "A relationships test fails: some values in orders.customer_id don't exist in customers.customer_id. What's the likely root cause and risk if ignored?",
      answer:
        "Likely causes include a late-arriving or deleted customer record, or a customer table load that ran before the orders load captured new customers. If ignored, downstream joins on customer_id silently drop those orders (inner join) or produce nulls (left join), undercounting or misattributing revenue without any error being raised.",
    },
    {
      question: "Why would a team configure a primary-key test to fail the pipeline (error) but a distribution test to only warn?",
      answer:
        "A broken primary key or referential integrity assertion causes silent row duplication or loss in every downstream join, which is high blast radius and hard to detect later. A distribution test (like a slowly rising null rate) signals something worth investigating but rarely corrupts downstream joins by itself, so blocking the whole pipeline on it isn't proportionate.",
    },
    {
      question: "What's the difference in intent between Great Expectations' expect_column_mean_to_be_between and a dbt accepted_values test?",
      answer:
        "expect_column_mean_to_be_between is a distribution check: it validates a statistical property of the column's values over the whole run. accepted_values is a membership check: it validates that every individual value in a column belongs to a known, finite set. One flags drift in aggregate behavior; the other flags any single out-of-bounds value.",
    },
  ],
};
