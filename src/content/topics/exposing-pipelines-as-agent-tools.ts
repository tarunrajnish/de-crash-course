import type { Topic } from "../types";

export const exposingPipelinesAsAgentTools: Topic = {
  id: "exposing-pipelines-as-agent-tools",
  glossary: ["MCP", "Tool schema", "Read tool", "Action tool"],
  title: "Exposing pipelines as agent tools (MCP)",
  shortDescription: "Wrapping a retrieval pipeline as a standard set of callable tools so any agent client, not just one app, can use it.",
  sections: [
    {
      heading: "A retrieval pipeline isn't automatically usable by an agent",
      paragraphs: [
        "A working retrieval pipeline (parsing, chunking, embedding, hybrid search, reranking) answers one question: given a query, which chunks are most relevant? That's a function, not an interface an AI agent can discover and call on its own. Something has to describe what the function does, what inputs it takes, and what it returns, in a format a language model can read and decide to invoke.",
        "The Model Context Protocol (MCP) is a standard way to expose exactly that: a server declares a set of named tools (for example search_library, get_transcript, summarize_doc), each with a description and a typed input/output schema, and any compatible agent client can discover those tools at connection time and call them when relevant to a user's request.",
        "The payoff of standardizing this is reuse: a retrieval pipeline wrapped as an MCP server can be used by multiple different agent applications, Claude, a custom agent, another team's tool, without each one needing custom integration code written against your pipeline's internal API.",
      ],
    },
    {
      heading: "Designing tools, not just exposing endpoints",
      paragraphs: [
        "A good tool interface is deliberately narrower than the underlying pipeline's full capability. search_library takes a query and returns ranked chunks; get_transcript takes a video ID and returns its full transcript with timestamps; summarize_doc takes a document ID and returns a summary. Each tool does one clear thing with a clear name, rather than exposing one generic \"run_pipeline\" tool with a dozen optional parameters.",
        "This matters because the agent (a language model) decides which tool to call and with what arguments based on the tool's name and description alone, before ever seeing what's inside. A vague tool name or an ambiguous description leads to the agent picking the wrong tool, or the right tool with wrong arguments, in ways that are hard to debug after the fact.",
        "Tool descriptions are effectively a prompt: they need to state clearly what the tool is for, what each parameter means, and what the tool deliberately does not do, the same care that goes into writing a clear function signature and docstring for a human developer who will call it without reading the implementation.",
      ],
      warning: "A tool with a misleading name (for example, a search_library tool that actually only searches PDFs, silently skipping videos and images) will get called in situations where it returns confidently incomplete results, with no indication to the agent or the user that other content types exist and were never checked.",
    },
    {
      heading: "Read tools versus action tools",
      paragraphs: [
        "Most of a retrieval pipeline's tools are read-only: they answer a question without changing anything. search_library, get_transcript, and summarize_doc all fall into this category, safe to call freely since they have no side effects.",
        "An action tool is different: it changes state outside the conversation, for example a create_study_note or add_to_reading_list tool that writes a new record somewhere. Action tools turn an agent from something that only answers questions into something that does things on the user's behalf, which is a meaningfully bigger scope of trust and requires its own validation, since a bad or hallucinated argument to an action tool produces a real side effect, not just a wrong answer in a chat window.",
        "This is also why action tools are usually the last piece added, after the read-only retrieval tools are solid: an agent that confidently takes the wrong action is a worse failure mode than one that confidently gives a wrong answer, because the action persists even if the conversation is later corrected.",
      ],
    },
  ],
  example: {
    title: "Three tools with different consequences",
    description: "A retrieval service exposes narrow MCP tools. Inputs below are illustrative tool arguments.",
    table: {
      headers: ["Tool", "Example input", "Effect"],
      rows: [
        ["search_library", "query: watermarks", "Read matching chunks"],
        ["get_transcript", "document: video7; start: 120s", "Read a source segment"],
        ["create_study_note", "source: video7; key: note42", "Write a note after authorization"],
      ],
    },
    takeaway: "Search and source lookup are read operations. Creating a note changes state, so validate permissions and use the request key to make retries safe.",
  },
  selfTest: [
    {
      question: "Why isn't a working retrieval pipeline automatically something an AI agent can use?",
      answer:
        "A pipeline is a function with an internal API; nothing about it tells an agent what the function does, what arguments it expects, or what it returns, in a form the agent can discover and reason about. A protocol like MCP standardizes that description as a set of named, typed tools that any compatible agent client can discover and call.",
    },
    {
      question: "Why design several narrow, named tools (search_library, get_transcript, summarize_doc) instead of one generic tool with many optional parameters?",
      answer:
        "An agent chooses which tool to call and what arguments to pass based only on each tool's name and description, before seeing what's inside. Narrow, clearly-named tools make that choice reliable; one generic tool with many optional parameters makes it easy for the agent to pick the wrong parameters or misunderstand what a given call will actually do.",
    },
    {
      question: "Why is a vague or misleading tool description a real bug, not just a cosmetic issue?",
      answer:
        "The agent decides when and how to call a tool based entirely on its description, without inspecting the implementation. A description that overstates what a tool covers (for example implying it searches all content types when it only searches one) causes the agent to trust results that are confidently incomplete, with no signal that anything was skipped.",
    },
    {
      question: "Why are action tools treated as a bigger scope of trust than read-only tools, and why are they typically added last?",
      answer:
        "A read tool that returns a wrong answer is a wrong answer in a chat window; an action tool that's called with a bad or hallucinated argument produces a real side effect, like a note being created with wrong content, that persists even after the conversation is corrected. Getting the read-only retrieval tools solid first reduces the chance an action tool gets triggered by faulty reasoning built on bad retrieval.",
    },
  ],
};
