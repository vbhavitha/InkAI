import AIToolCard from "./AIToolCard";

const tools = [
  {
    id: "grammar",
    title: "Grammar Correction",
    description:
      "Correct grammar, spelling, and punctuation.",
    icon: "✍️",
  },
  {
    id: "rewrite",
    title: "Rewrite",
    description:
      "Rewrite notes in a selected style.",
    icon: "🔄",
  },
  {
    id: "summary",
    title: "Summarize",
    description:
      "Create concise summaries and key points.",
    icon: "📝",
  },
  {
    id: "flashcards",
    title: "Flashcards",
    description:
      "Turn notes into study flashcards.",
    icon: "🎴",
  },
  {
    id: "mcqs",
    title: "MCQs",
    description:
      "Generate multiple-choice questions.",
    icon: "❓",
  },
  {
    id: "questions",
    title: "Questions",
    description:
      "Generate exam and practice questions.",
    icon: "📚",
  },
  {
    id: "explain",
    title: "Explain",
    description:
      "Understand difficult topics easily.",
    icon: "💡",
  },
  {
    id: "translate",
    title: "Translate",
    description:
      "Translate notes into another language.",
    icon: "🌐",
  },
  {
    id: "presentation",
    title: "Presentation",
    description:
      "Convert notes into PowerPoint slides.",
    icon: "📊",
  },
  {
    id: "markdown",
    title: "Markdown",
    description:
      "Convert notes into clean Markdown.",
    icon: "📄",
  },
];

export default function AIToolPanel({
  activeTool,
  onSelect,
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <AIToolCard
          key={tool.id}
          {...tool}
          active={activeTool === tool.id}
          onClick={() =>
            onSelect(tool.id)
          }
        />
      ))}
    </div>
  );
}