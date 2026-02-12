// @ts-nocheck
const { useMemo, useState, useEffect } = React;

// Strand color helpers
const STRAND_COLORS = {
  "Reading Literary": "bg-rose-50 border-rose-200",
  "Reading Informational": "bg-sky-50 border-sky-200",
  Writing: "bg-amber-50 border-amber-200",
  "Speaking & Listening": "bg-emerald-50 border-emerald-200",
  Language: "bg-violet-50 border-violet-200",
};

const getGradeNumber = (gradeLabel) => parseInt(String(gradeLabel).match(/\d+/)?.[0] || "0", 10);

// Fallback sample data (used only if /data/ga-ela.json is missing)
const FALLBACK = [
  { grade: "Grade 3", strand: "Reading Literary", code: "ELAGSE3RL1", description: "Ask and answer questions to demonstrate understanding of a text, referring explicitly to the text as the basis for the answers.", details: "Students cite specific parts of the text when explaining their answers to questions about key details.", ALD: "Developing: answers literal questions with general references; Proficient: answers literal and inferential questions with explicit references; Distinguished: synthesizes across sections with precise evidence.", evidence: "Evidence statement notes: references should include sentence or paragraph identifiers when available.", samples: ["SR: Which detail best supports the idea that…?", "EBSR: Select the sentence that best supports your answer to Part A."] },
  { grade: "Grade 3", strand: "Reading Informational", code: "ELAGSE3RI2", description: "Determine the main idea of a text; recount the key details and explain how they support the main idea.", details: "Focus on central idea identification with accurate recount of supporting details.", ALD: "Developing: names a topic; Proficient: states main idea and explains support; Distinguished: integrates multiple details to justify the main idea.", evidence: "Look for paraphrased main idea stated in the student’s own words.", samples: ["MS: Select two details that best support the main idea.", "Short Constructed Response: Explain how detail X supports the main idea."] },
  { grade: "Grade 5", strand: "Reading Literary", code: "ELAGSE5RL1", description: "Quote accurately from a text when explaining what the text says explicitly and when drawing inferences from the text.", details: "Emphasis on accurate quoting and clear linkage between evidence and inference.", ALD: "Developing: cites general parts; Proficient: quotes accurately and links to inference; Distinguished: integrates multiple quotations to support a claim.", evidence: "Student responses include quotation marks and minimal ellipses with accurate attribution.", samples: ["EBSR: Choose two quotes that best support the inference in Part A.", "SR: Which quotation best shows that the narrator is uncertain?"] },
  { grade: "Grade 5", strand: "Writing", code: "ELAGSE5W2", description: "Write informative/explanatory texts to examine a topic and convey ideas and information clearly.", details: "Focus on organization (intro, logically grouped ideas, formatting/graphics, precise language).", ALD: "Developing: provides facts; Proficient: organizes ideas with clear transitions; Distinguished: integrates domain vocabulary and formatting effectively.", evidence: "Rubric emphasizes organization, elaboration, and precision.", samples: ["Extended Response: Explain how… using facts, definitions, and details."] },
  { grade: "Grade 8", strand: "Reading Informational", code: "ELAGSE8RI1", description: "Cite the textual evidence that most strongly supports an analysis of what the text says explicitly as well as inferences drawn from the text.", details: "Prioritize the strength and relevance of evidence; distinguish stronger vs. weaker support.", ALD: "Developing: cites some evidence; Proficient: selects strongest evidence; Distinguished: evaluates and contrasts multiple pieces of evidence.", evidence: "Responses should justify why selected evidence is strongest.", samples: ["MS: Select two sentences that most strongly support the analysis.", "Short Constructed Response: Explain why your evidence is the strongest."] },
  { grade: "Grade 8", strand: "Language", code: "ELAGSE8L4", description: "Determine or clarify the meaning of unknown and multiple-meaning words and phrases based on grade 8 reading and content.", details: "Includes context clues, affixes, use of reference materials, and verifying preliminary determinations.", ALD: "Developing: uses context at a basic level; Proficient: integrates context and morphology; Distinguished: verifies meaning using multiple strategies.", evidence: "Student rationales demonstrate the strategy used to determine meaning.", samples: ["SR: Which meaning of the word as used in paragraph 4?"] }
];

function useData() {
  const [data, setData] = useState(FALLBACK);
  const [loadedFromJson, setLoadedFromJson] = useState(false);
  useEffect(() => {
    fetch("./data/ga-ela.json?" + Date.now())
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json && Array.isArray(json) && json.length) {
          setData(json);
          setLoadedFromJson(true);
        }
      })
      .catch(() => {});
  }, []);
  return { data, loadedFromJson };
}

function useFilteredData(data, query, grade, selectedCodeForProgression) {
  return React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = data;

    if (grade && grade !== "All Grades") {
      list = list.filter((d) => d.grade === grade);
    }

    if (q) {
      list = list.filter((d) =>
        [d.code, d.description, d.details, d.strand].join(" ").toLowerCase().includes(q)
      );
    }

    let progression = null;
    if (selectedCodeForProgression) {
      const root = selectedCodeForProgression.replace(/^ELAGSE\d+/, "ELAGSE").replace(/\d+$/, "");
      progression = data.filter((d) => d.code.startsWith(root));
    }

    return { list, progression };
  }, [data, query, grade, selectedCodeForProgression]);
}

function App() {
  const { data, loadedFromJson } = useData();
  const [grade, setGrade] = useState(() => new URLSearchParams(window.location.search).get("grade") || "All Grades");
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get("q") || "");
  const [expanded, setExpanded] = useState({});
  const [selectedCode, setSelectedCode] = useState(() => new URLSearchParams(window.location.search).get("code") || null);

  const grades = useMemo(() => {
    const set = new Set(data.map((d) => d.grade));
    const sorted = Array.from(set).sort((a, b) => getGradeNumber(a) - getGradeNumber(b));
    return ["All Grades", ...sorted];
  }, [data]);

  const codeOptions = useMemo(() => {
    const uniqueCodes = Array.from(new Set(data.map((d) => d.code)));
    return uniqueCodes.sort((a, b) => a.localeCompare(b));
  }, [data]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (grade && grade !== "All Grades") params.set("grade", grade);
    else params.delete("grade");
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    if (selectedCode) params.set("code", selectedCode);
    else params.delete("code");
    const next = params.toString();
    const nextUrl = next ? `${window.location.pathname}?${next}` : window.location.pathname;
    window.history.replaceState({}, "", nextUrl);
  }, [grade, query, selectedCode]);

  const { list, progression } = useFilteredData(data, query, grade, selectedCode);

  const groupedByStrand = useMemo(() => {
    const groups = {};
    list.forEach((d) => {
      groups[d.strand] = groups[d.strand] || [];
      groups[d.strand].push(d);
    });
    return groups;
  }, [list]);

  const handlePrint = () => window.print();
  const clearFilters = () => {
    setGrade("All Grades");
    setQuery("");
    setSelectedCode(null);
  };

  return (
    <div className="min-h-screen w-full">
      <header className="sticky top-0 z-20 backdrop-blur bg-white/80 border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Georgia ELA Standards — Guide</h1>
            <p className="text-sm text-neutral-600">Card view · Grade filter · Cross-grade progression · Search · Print</p>
            {!loadedFromJson && (
              <p className="text-xs text-amber-700 mt-1">Using sample data. Add full data to <code>data/ga-ela.json</code>.</p>
            )}
          </div>
          <div className="flex gap-2">
            <button aria-label="Print current standards view" onClick={handlePrint} className="px-3 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-sm">Print Current View</button>
            <button disabled title="Export is not available yet" className="px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-100 text-neutral-400 text-sm cursor-not-allowed">Export (CSV/PDF)</button>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-4 grid grid-cols-1 md:grid-cols-4 gap-3 print:hidden">
        <div className="md:col-span-1">
          <label htmlFor="grade-filter" className="text-xs font-medium text-neutral-600">Grade</label>
          <select id="grade-filter" value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl border border-neutral-300 bg-white">
            {grades.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="search-standards" className="text-xs font-medium text-neutral-600">Search</label>
          <input id="search-standards" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search code, description, strand…" className="w-full mt-1 px-3 py-2 rounded-xl border border-neutral-300 bg-white" />
        </div>
        <div className="md:col-span-1">
          <label htmlFor="progression-code" className="text-xs font-medium text-neutral-600">Cross-Grade View</label>
          <select id="progression-code" value={selectedCode || ""} onChange={(e) => setSelectedCode(e.target.value || null)} className="w-full mt-1 px-3 py-2 rounded-xl border border-neutral-300 bg-white">
            <option value="">— Select a standard to see progression —</option>
            {codeOptions.map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-2 print:hidden flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-600" aria-live="polite">Showing {list.length} standard{list.length !== 1 ? "s" : ""}.</p>
        <button onClick={clearFilters} className="px-3 py-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-xs">Reset Filters</button>
      </section>

      {selectedCode && progression && progression.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold">Cross-Grade Progression</h2>
                <p className="text-sm text-neutral-600">Showing all grades that share the code root with <span className="font-mono">{selectedCode}</span>.</p>
              </div>
              <button onClick={() => setSelectedCode(null)} className="px-3 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-sm">Clear</button>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              {progression.slice().sort((a, b) => getGradeNumber(a.grade) - getGradeNumber(b.grade)).map((d) => (
                <div key={d.code + d.grade} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  <div className="text-xs text-neutral-600">{d.grade}</div>
                  <div className="font-semibold">{d.code}</div>
                  <div className="text-sm mt-1">{d.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <main className="max-w-6xl mx-auto px-4 py-4 print:px-0">
        {Object.keys(groupedByStrand).length === 0 ? (
          <div className="text-neutral-600 rounded-xl border border-dashed border-neutral-300 bg-white p-6">No standards match your filters. Try resetting filters or broadening your search terms.</div>
        ) : (
          Object.entries(groupedByStrand).map(([strand, items]) => (
            <section key={strand} className="mb-6 break-inside-avoid-page">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold">{strand}</h2>
                <span className="text-sm text-neutral-600">{items.length} standard{items.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.slice().sort((a, b) => a.code.localeCompare(b.code)).map((d) => {
                  const color = STRAND_COLORS[d.strand] || "bg-white border-neutral-200";
                  const expandedKey = `${d.code}::${d.grade}`;
                  const isOpen = !!expanded[expandedKey];
                  return (
                    <article key={d.code + d.grade} className={`rounded-2xl border ${color} p-4 shadow-sm`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs text-neutral-600">{d.grade}</div>
                          <div className="font-semibold tracking-tight">{d.code}</div>
                        </div>
                        <button aria-expanded={isOpen} aria-label={`${isOpen ? "Hide" : "Show"} details for ${d.code} ${d.grade}`} onClick={() => setExpanded((prev) => ({ ...prev, [expandedKey]: !prev[expandedKey] }))} className="px-3 py-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-xs">{isOpen ? "Hide Details" : "Show Details"}</button>
                      </div>
                      <p className="mt-2 text-[15px] leading-snug">{d.description}</p>
                      {isOpen && (
                        <div className="mt-3 grid grid-cols-1 gap-3">
                          <div className="rounded-xl border border-neutral-200 bg-white p-3">
                            <div className="text-sm font-semibold">ALDs</div>
                            <div className="text-sm text-neutral-700 mt-1">{d.ALD}</div>
                          </div>
                          <div className="rounded-xl border border-neutral-200 bg-white p-3">
                            <div className="text-sm font-semibold">Evidence Notes</div>
                            <div className="text-sm text-neutral-700 mt-1">{d.evidence}</div>
                          </div>
                          <div className="rounded-xl border border-neutral-200 bg-white p-3">
                            <div className="text-sm font-semibold">Sample Items</div>
                            <ul className="list-disc pl-5 text-sm text-neutral-800 mt-1">
                              {d.samples.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 pb-10 text-center text-xs text-neutral-500">
        <hr className="my-6 border-neutral-200" />
        <p>Georgia ELA Standards Guide · GitHub Pages Prototype · Replace sample data in <code>data/ga-ela.json</code>.</p>
      </footer>

      <style>{`@media print { header, .print\\:hidden { display: none !important; } main { padding: 0 !important; } section { break-inside: avoid-page; } article { box-shadow: none !important; } }`}</style>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
