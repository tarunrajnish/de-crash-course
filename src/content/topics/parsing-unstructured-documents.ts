import type { Topic } from "../types";

export const parsingUnstructuredDocuments: Topic = {
  id: "parsing-unstructured-documents",
  glossary: ["Docling", "Unstructured", "Whisper", "OCR", "Vision model"],
  title: "Parsing PDFs, audio, and images into text",
  shortDescription: "Turning a messy pile of PDFs, recordings, and screenshots into structured, citable text, the step before any of it can be embedded.",
  sections: [
    {
      heading: "A PDF is not a text file",
      paragraphs: [
        "A PDF encodes where characters are drawn on a page, not what document structure they belong to. Naively extracting \"all the text\" from a multi-column paper or a manual full of tables usually scrambles reading order: a two-column layout gets interleaved line by line, and a table's cells get flattened into a single run-on sentence with no column boundaries.",
        "Layout-aware parsers (tools like Docling or Unstructured) instead detect the document's visual structure first, headings, paragraphs, tables, lists, reading-order columns, and emit that structure explicitly rather than a flat character stream. A heading tagged as a heading lets downstream chunking split on section boundaries instead of arbitrary character counts; a table kept as rows and columns can be rendered back into readable text (or even queried directly) instead of being lost as noise.",
        "This matters because retrieval quality downstream is capped by what survives parsing. A chunk built from a scrambled table is not just imprecise, it is actively wrong, and no amount of embedding-model quality fixes bad input text.",
      ],
      warning: "Running OCR or raw text extraction on a scanned PDF without checking layout output first is a common silent failure: the job succeeds, text comes out, and every table in the document is garbage until someone actually reads a sample.",
    },
    {
      heading: "Transcribing audio and video: the timestamp is the point",
      paragraphs: [
        "Speech-to-text models like Whisper convert spoken audio into text, but for a library of talks and tutorials, the transcript alone throws away the most useful piece of metadata: when each statement was said. Whisper (and similar models) can emit word- or segment-level timestamps alongside the text, not just a flat transcript.",
        "Keeping those timestamps means a retrieved chunk can point back to \"at 12:34\" in the source video instead of just quoting text with no way to verify or rewatch it in context. That one design choice, keep timestamps through chunking and storage rather than discarding them after transcription, is what turns a transcript into a citable source instead of a wall of unattributed text.",
        "Long recordings also need chunk boundaries that respect natural pauses or topic shifts (often available from the transcription model's own segment boundaries) rather than arbitrary token counts, since a video can run for hours and a single chunk boundary dropped mid-sentence loses the same context a PDF chunk would.",
      ],
    },
    {
      heading: "Images: OCR versus captioning are different tools",
      paragraphs: [
        "A screenshot of a terminal, an error message, or a slide deck contains text that OCR (optical character recognition) extracts directly, character by character. A photo of a whiteboard diagram or a chart with no embedded text has nothing for OCR to extract; it needs a vision-capable model to produce a natural-language caption describing what the image shows.",
        "Most real image libraries need both, applied conditionally: a quick heuristic or a vision model's own judgment decides whether an image is mostly text (route to OCR) or mostly visual content (route to captioning), since running the wrong one wastes compute and produces worse text either way.",
        "Captions and OCR output are lower-fidelity than parsed document text, OCR makes character-level mistakes and captions are lossy summaries, so it's worth tracking parsing confidence or model-reported quality alongside the extracted text, the same way a data pipeline would track a source's data-quality score.",
      ],
      table: {
        caption: "Matching the extraction method to the source",
        headers: ["Source type", "Extraction method", "What's preserved"],
        rows: [
          ["Digital PDF", "Layout-aware parsing (Docling / Unstructured)", "Headings, tables, reading order"],
          ["Scanned PDF / image of text", "OCR", "Character-level text content"],
          ["Audio / video", "Speech-to-text with timestamps (Whisper)", "Transcript text, time offsets"],
          ["Photo / diagram / chart", "Vision captioning", "Natural-language description, not exact text"],
        ],
      },
    },
  ],
  example: {
    title: "Preserve structure and source location",
    description: "Small illustrative outputs show what a downstream retrieval chunk would otherwise lose.",
    table: {
      headers: ["Source", "Weak extraction", "Useful extraction"],
      rows: [
        ["Two-column page", "A1 B1 A2 B2", "A1 A2, then B1 B2 in reading order"],
        ["Spoken explanation", "Watermarks bound state.", "02:10-02:18: Watermarks bound state."],
        ["Scanned error image", "Image pixels only", "OCR text: ERROR E4521"],
      ],
    },
    takeaway: "Keep reading order for documents, timestamps for recordings, and recognized characters for text-heavy images. Those details make a retrieved result verifiable.",
  },
  selfTest: [
    {
      question: "Why does naive text extraction from a multi-column PDF or a table often produce unusable output, and what do layout-aware parsers do differently?",
      answer:
        "A PDF only encodes where characters are positioned on a page, not what structural element they belong to, so flat extraction reads a two-column page line by line across both columns, and flattens a table's rows and columns into one run-on string with no boundaries. Layout-aware parsers detect visual structure first (headings, tables, columns, reading order) and emit that structure explicitly instead of a flat character stream.",
    },
    {
      question: "Why is keeping timestamps through transcription and chunking important, beyond just having a readable transcript?",
      answer:
        "Timestamps turn a transcript into a citable source: a retrieved chunk can reference an exact point in the recording (\"at 12:34\") so an answer can be verified or the source rewatched in context, instead of just quoting unattributed text with no way to check where it came from.",
    },
    {
      question: "When would you use OCR on an image, and when would you use a vision captioning model instead?",
      answer:
        "OCR extracts text that's actually rendered in the image character by character, so it's right for screenshots, scanned documents, or slides with embedded text. Captioning is for images with no embedded text to extract, like a photo of a whiteboard diagram or a chart, where a vision model instead produces a natural-language description of what's shown.",
    },
    {
      question: "Why would you track a confidence or quality score alongside OCR or caption output, the way you'd track a data-quality score for any other source?",
      answer:
        "OCR makes character-level recognition errors and captions are lossy, approximate summaries rather than exact text, so the extracted output is lower-fidelity than parsed document text. Tracking a quality signal lets downstream retrieval or chunking treat low-confidence extractions differently (for example, flagging or excluding them) instead of treating all extracted text as equally reliable.",
    },
  ],
};
