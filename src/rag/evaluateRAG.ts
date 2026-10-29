import { queryRAG, getKnowledgeStats } from "./index";

async function runEvaluation() {
  console.log("=== Comprehensive RAG Evaluation Suite ===");
  const stats = getKnowledgeStats();
  console.log(`Documents indexed: ${stats.documentsCount}`);
  console.log(`Total Chunks indexed: ${stats.chunksCount}`);
  stats.documents.forEach((d) => console.log(` - ${d.title} (${d.sourceFile})`));
  console.log("==========================================\n");

  const testQueries = [
    {
      name: "Basic Question 1: What is knitting?",
      question: "what is knitting?",
    },
    {
      name: "Basic Question 2: What is yarn?",
      question: "what is yarn?",
    },
    {
      name: "Basic Question 3: What is a slip knot?",
      question: "what is a slip knot?",
    },
    {
      name: "Materials Question: What materials are required?",
      question: "What materials are required?",
    },
    {
      name: "Process Question: How do I start knitting?",
      question: "How do I start knitting?",
    },
    {
      name: "Comparison Question: Difference between wool and cotton yarn",
      question: "What is the difference between wool yarn and cotton yarn?",
    },
    {
      name: "Technique Question: Why should I not pull yarn too tightly?",
      question: "Why should I avoid pulling the yarn too tightly?",
    },
    {
      name: "Presentation Question: How to present products?",
      question: "How can I present and share my knitted products attractively?",
    },
    {
      name: "Out of Scope Question 1: Chemistry / Acrylic",
      question: "What is the chemical composition of acrylic yarn?",
    },
    {
      name: "Out of Scope Question 2: Baking cake",
      question: "How do I bake a chocolate cake?",
    },
  ];

  for (const t of testQueries) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`TEST: ${t.name}`);
    console.log(`QUERY: "${t.question}"`);

    const result = await queryRAG({
      question: t.question,
      language: "en",
    });

    console.log(`\nRESULT SUMMARY:`);
    console.log(`Confidence: ${result.confidence}`);
    console.log(
      `Sources: ${
        result.sources.length > 0
          ? result.sources.map((s) => `${s.videoTitle} (${s.score})`).join(", ")
          : "None (out of scope)"
      }`
    );
    console.log(`Answer:\n${result.answer}`);
  }

  console.log("\n============================================================");
  console.log("Evaluation run finished!");
}

runEvaluation().catch(console.error);
