import { useState } from "react";

import AIToolPanel from "../components/ai/AIToolPanel";
import GrammarTool from "../components/ai/GrammarTool";
import RewriteTool from "../components/ai/RewriteTool";

export default function AIToolsPage() {
  const [activeTool, setActiveTool] =
    useState("grammar");

  const renderTool = () => {
    switch (activeTool) {
      case "grammar":
        return <GrammarTool />;

      case "rewrite":
        return <RewriteTool />;

      default:
        return (
          <div className="rounded-xl border p-6">
            <h2 className="text-lg font-semibold">
              {activeTool}
            </h2>

            <p className="mt-2 opacity-70">
              This AI tool will be connected here.
            </p>
          </div>
        );
    }
  };

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-6">
      <header>
        <h1 className="text-3xl font-bold">
          AI Tools
        </h1>

        <p className="mt-2 opacity-70">
          Transform, understand, and study your
          notes with InkAI.
        </p>
      </header>

      <AIToolPanel
        activeTool={activeTool}
        onSelect={setActiveTool}
      />

      <section>
        {renderTool()}
      </section>
    </main>
  );
}