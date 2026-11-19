import type { Topic } from "../types";

export const agentLoopsAndToolCalling: Topic = {
  id: "agent-loops-and-tool-calling",
  glossary: ["ReAct", "LangGraph", "Workflow state", "Tool calling"],
  title: "Agent loops: tool calling and taking action",
  shortDescription: "The reason-act-observe cycle underneath every tool-using agent, and what a framework like LangGraph buys you over a hand-rolled loop.",
  sections: [
    {
      heading: "The basic loop underneath every tool-using agent",
      paragraphs: [
        "A tool-using agent is, mechanically, a loop: the model receives a user request plus a list of available tools, decides whether it needs a tool to answer, calls one if so, receives the tool's result back as new context, and repeats, deciding again whether it has enough information to answer or needs to call another tool.",
        "This pattern is sometimes called ReAct (reason, act, observe): the model reasons about what to do next, takes an action (a tool call), observes the result, and loops back to reasoning with that new information folded in. Nothing about this requires a specific framework; it can be written as a plain while loop that checks whether the model's response contains a tool call, executes it if so, and feeds the result back in.",
        "The loop terminates when the model produces a final answer with no further tool calls, or when a safety limit (a maximum number of iterations) is hit, which matters because a model can get stuck calling the same tool repeatedly with slightly different arguments if its reasoning isn't converging toward an answer.",
      ],
    },
    {
      heading: "What a hand-rolled loop makes you confront directly",
      paragraphs: [
        "Writing the loop yourself forces explicit decisions a framework would otherwise make for you: how many tool calls are allowed before stopping, what happens when a tool call fails (does the error go back to the model as context, or does the whole loop abort?), and how much of the growing conversation history gets kept versus trimmed as the loop runs long and context fills up.",
        "It also makes the failure modes visible early: a model that calls a tool, gets a result, and calls the exact same tool with the exact same arguments again is a sign the loop isn't giving the model a strong enough signal that the question is already answered, something easy to miss if a framework is managing the loop internally and only surfacing the final answer.",
      ],
    },
    {
      heading: "What a framework like LangGraph adds",
      paragraphs: [
        "LangGraph models the agent as an explicit state graph: nodes represent steps (call the model, run a tool, check a condition), edges represent transitions between them, and the graph's state is a typed object that's threaded through every step. This makes branching logic, for example, routing to a human-approval step before an action tool runs, something you draw as a graph edge rather than nested if-statements inside a loop.",
        "The practical advantages over a hand-rolled loop are mostly around things that are tedious to build correctly from scratch: built-in state persistence (so a long-running agent can pause and resume), streaming intermediate steps to a UI, and visualizing the graph structure to debug why the agent took a particular path through it.",
        "The trade-off is the same one any framework introduces: more structure and less code to write yourself, at the cost of needing to understand the framework's abstractions (nodes, edges, state reducers) on top of understanding the underlying ReAct loop they're built on.",
      ],
      table: {
        caption: "Hand-rolled loop vs. a graph framework",
        headers: ["", "Hand-rolled loop", "LangGraph"],
        rows: [
          ["Control flow", "Explicit, in plain code", "Declared as a graph of nodes/edges"],
          ["Branching (e.g. approval steps)", "Nested conditionals", "Graph edges with conditions"],
          ["State persistence across pauses", "Build it yourself", "Built in"],
          ["Learning curve", "Just the ReAct loop itself", "ReAct loop plus framework abstractions"],
        ],
      },
    },
    {
      heading: "Comparing them is itself a useful exercise",
      paragraphs: [
        "Building both, a hand-rolled loop first, then the same agent reimplemented in a framework, surfaces exactly what the framework is doing for you, because you've already built the thing it's abstracting away. It's a much clearer way to evaluate whether a framework is worth its overhead for a given project than reading its documentation in isolation.",
        "For a small agent with a handful of tools and no need for pausing, resuming, or approval steps, a hand-rolled loop is often genuinely simpler to reason about and debug. The framework earns its complexity once the agent's control flow (branches, retries, human-in-the-loop checkpoints) grows past what's comfortable to track in nested conditionals.",
      ],
    },
  ],
  example: {
    title: "A tool-using loop that knows when to stop",
    description: "Request: find the note explaining watermarks. The application allows at most three tool calls for this request.",
    steps: [
      { label: "Request", detail: "Give the model the question and the available search tool schema." },
      { label: "Call a tool", detail: "The model requests search_library with query \"watermarks\"; the host runs it." },
      { label: "Observe", detail: "The tool returns note N7 with a relevant excerpt and source location." },
      { label: "Answer and stop", detail: "Return the explanation with a citation to N7; no further tool call is needed." },
    ],
    takeaway: "Feed the tool result back into the next model step. Persist the workflow state if resuming is required, and enforce the call limit in the host.",
  },
  selfTest: [
    {
      question: "What is the ReAct pattern, and why is it a loop rather than a single request-response?",
      answer:
        "ReAct is reason, act, observe: the model reasons about what to do, calls a tool (act), receives the tool's result (observe), then reasons again with that new information. It has to be a loop because answering a question often requires multiple tool calls, each informed by the result of the previous one, not a single fixed sequence decided up front.",
    },
    {
      question: "Name two concrete decisions a hand-rolled agent loop forces you to make explicitly that a framework might otherwise hide.",
      answer:
        "How many tool-call iterations to allow before stopping (to prevent infinite loops), and what happens when a tool call fails, whether the error is fed back to the model as context to reason about, or the whole loop aborts. A third is how much conversation history to keep versus trim as the loop runs long.",
    },
    {
      question: "What does LangGraph's graph-of-nodes-and-edges model make easier than a nested-conditional hand-rolled loop, specifically?",
      answer:
        "Branching logic, like routing to a human-approval step before an action tool runs, becomes an edge in the graph rather than nested if-statements buried inside a loop, plus built-in state persistence so a long-running agent can pause and resume, both of which are tedious to build correctly from scratch.",
    },
    {
      question: "Why build the same agent both ways (hand-rolled, then in a framework) instead of picking one from the start?",
      answer:
        "Building the hand-rolled version first means you already understand exactly what the ReAct loop is doing. Reimplementing the same agent in a framework then shows precisely what the framework is abstracting away, making it possible to judge whether that abstraction is worth its added complexity for this specific project, rather than guessing from documentation alone.",
    },
    {
      question: "Why might a hand-rolled loop be the better choice for a small agent with only a few tools?",
      answer:
        "If the agent doesn't need pausing, resuming, streaming to a UI, or approval-gated branching, a plain loop is simpler to read, debug, and reason about end to end. A framework's abstractions earn their overhead once the control flow grows past what's comfortable to track as nested conditionals, not before.",
    },
  ],
};
