// @ts-nocheck
const { useMemo, useState, useEffect, useRef } = React;

const STRAND_COLORS = {
  "Reading Literary": {
    chip: "bg-rose-100 text-rose-900 border-rose-200",
    card: "bg-rose-50/80 border-rose-200",
    accent: "from-rose-200 to-rose-50",
  },
  "Reading Informational": {
    chip: "bg-sky-100 text-sky-900 border-sky-200",
    card: "bg-sky-50/80 border-sky-200",
    accent: "from-sky-200 to-sky-50",
  },
  Writing: {
    chip: "bg-amber-100 text-amber-900 border-amber-200",
    card: "bg-amber-50/80 border-amber-200",
    accent: "from-amber-200 to-amber-50",
  },
  "Speaking & Listening": {
    chip: "bg-emerald-100 text-emerald-900 border-emerald-200",
    card: "bg-emerald-50/80 border-emerald-200",
    accent: "from-emerald-200 to-emerald-50",
  },
  Language: {
    chip: "bg-indigo-100 text-indigo-900 border-indigo-200",
    card: "bg-indigo-50/80 border-indigo-200",
    accent: "from-indigo-200 to-indigo-50",
  },
};

const STRAND_ORDER = [
  "Reading Literary",
  "Reading Informational",
  "Writing",
  "Speaking & Listening",
  "Language",
];

const getGradeNumber = (gradeLabel) => parseInt(String(gradeLabel).match(/\d+/)?.[0] || "0", 10);

const parseCode = (code) => {
  const match = String(code).toUpperCase().match(/^ELAGSE\d+([A-Z]+)(\d+)$/);
  if (!match) return null;
  return { strandCode: match[1], standardNum: match[2], progressionKey: `${match[1]}-${match[2]}` };
};

const FALLBACK = [
  { grade: "Grade 3", strand: "Reading Literary", code: "ELAGSE3RL1", description: "Ask and answer questions to demonstrate understanding of a text, referring explicitly to the text as the basis for the answers.", details: "Students cite specific parts of the text when explaining their answers to questions about key details.", ALD: "Developing: answers literal questions with general references; Proficient: answers literal and inferential questions with explicit references; Distinguished: synthesizes across sections with precise evidence.", evidence: "Evidence statement notes: references should include sentence or paragraph identifiers when available.", samples: ["SR: Which detail best supports the idea that...?", "EBSR: Select the sentence that best supports your answer to Part A."] },
  { grade: "Grade 3", strand: "Reading Informational", code: "ELAGSE3RI2", description: "Determine the main idea of a text; recount the key details and explain how they support the main idea.", details: "Focus on central idea identification with accurate recount of supporting details.", ALD: "Developing: names a topic; Proficient: states main idea and explains support; Distinguished: integrates multiple details to justify the main idea.", evidence: "Look for paraphrased main idea stated in the student's own words.", samples: ["MS: Select two details that best support the main idea.", "Short Constructed Response: Explain how detail X supports the main idea."] },
  { grade: "Grade 5", strand: "Reading Literary", code: "ELAGSE5RL1", description: "Quote accurately from a text when explaining what the text says explicitly and when drawing inferences from the text.", details: "Emphasis on accurate quoting and clear linkage between evidence and inference.", ALD: "Developing: cites general parts; Proficient: quotes accurately and links to inference; Distinguished: integrates multiple quotations to support a claim.", evidence: "Student responses include quotation marks and minimal ellipses with accurate attribution.", samples: ["EBSR: Choose two quotes that best support the inference in Part A.", "SR: Which quotation best shows that the narrator is uncertain?"] },
  { grade: "Grade 5", strand: "Writing", code: "ELAGSE5W2", description: "Write informative/explanatory texts to examine a topic and convey ideas and information clearly.", details: "Focus on organization (intro, logically grouped ideas, formatting/graphics, precise language).", ALD: "Developing: provides facts; Proficient: organizes ideas with clear transitions; Distinguished: integrates domain vocabulary and formatting effectively.", evidence: "Rubric emphasizes organization, elaboration, and precision.", samples: ["Extended Response: Explain how... using facts, definitions, and details."] },
  { grade: "Grade 8", strand: "Reading Informational", code: "ELAGSE8RI1", description: "Cite the textual evidence that most strongly supports an analysis of what the text says explicitly as well as inferences drawn from the text.", details: "Prioritize the strength and relevance of evidence; distinguish stronger vs. weaker support.", ALD: "Developing: cites some evidence; Proficient: selects strongest evidence; Distinguished: evaluates and contrasts multiple pieces of evidence.", evidence: "Responses should justify why selected evidence is strongest.", samples: ["MS: Select two sentences that most strongly support the analysis.", "Short Constructed Response: Explain why your evidence is the strongest."] },
  { grade: "Grade 8", strand: "Language", code: "ELAGSE8L4", description: "Determine or clarify the meaning of unknown and multiple-meaning words and phrases based on grade 8 reading and content.", details: "Includes context clues, affixes, use of reference materials, and verifying preliminary determinations.", ALD: "Developing: uses context at a basic level; Proficient: integrates context and morphology; Distinguished: verifies meaning using multiple strategies.", evidence: "Student rationales demonstrate the strategy used to determine meaning.", samples: ["SR: Which meaning of the word as used in paragraph 4?"] },
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

function useFilteredData(data, query, grade, selectedStrand, selectedCodeForProgression) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = data;

    if (grade && grade !== "All Grades") {
      list = list.filter((d) => d.grade === grade);
    }

    if (selectedStrand && selectedStrand !== "All Strands") {
      list = list.filter((d) => d.strand === selectedStrand);
    }

    if (q) {
      list = list.filter((d) => [d.code, d.description, d.details, d.strand, d.grade].join(" ").toLowerCase().includes(q));
    }

    let progression = null;
    if (selectedCodeForProgression) {
      const target = parseCode(selectedCodeForProgression);
      if (target) {
        progression = data.filter((d) => parseCode(d.code)?.progressionKey === target.progressionKey);
      } else {
        const selected = data.find((d) => d.code === selectedCodeForProgression);
        if (selected) {
          progression = data.filter(
            (d) =>
              d.description.trim().toLowerCase() === selected.description.trim().toLowerCase() &&
              d.strand === selected.strand
          );
        }
      }
    }

    return { list, progression };
  }, [data, query, grade, selectedStrand, selectedCodeForProgression]);
}

function App() {
  const { data, loadedFromJson } = useData();
  const params = new URLSearchParams(window.location.search);
  const searchInputRef = useRef(null);

  const [grade, setGrade] = useState(() => params.get("grade") || "All Grades");
  const [query, setQuery] = useState(() => params.get("q") || "");
  const [selectedStrand, setSelectedStrand] = useState(() => params.get("strand") || "All Strands");
  const [selectedCode, setSelectedCode] = useState(() => params.get("code") || null);
  const [expanded, setExpanded] = useState({});

  const grades = useMemo(() => {
    const set = new Set(data.map((d) => d.grade));
    const sorted = Array.from(set).sort((a, b) => getGradeNumber(a) - getGradeNumber(b));
    return ["All Grades", ...sorted];
  }, [data]);

  const strands = useMemo(() => {
    const set = new Set(data.map((d) => d.strand));
    const sorted = Array.from(set).sort((a, b) => {
      const ai = STRAND_ORDER.indexOf(a);
      const bi = STRAND_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    return ["All Strands", ...sorted];
  }, [data]);

  const codeOptions = useMemo(() => {
    const uniqueCodes = Array.from(new Set(data.map((d) => d.code)));
    return uniqueCodes.sort((a, b) => a.localeCompare(b));
  }, [data]);

  useEffect(() => {
    const nextParams = new URLSearchParams(window.location.search);

    if (grade && grade !== "All Grades") nextParams.set("grade", grade);
    else nextParams.delete("grade");

    if (selectedStrand && selectedStrand !== "All Strands") nextParams.set("strand", selectedStrand);
    else nextParams.delete("strand");

    if (query.trim()) nextParams.set("q", query.trim());
    else nextParams.delete("q");

    if (selectedCode) nextParams.set("code", selectedCode);
    else nextParams.delete("code");

    const next = nextParams.toString();
    const nextUrl = next ? `${window.location.pathname}?${next}` : window.location.pathname;
    window.history.replaceState({}, "", nextUrl);
  }, [grade, selectedStrand, query, selectedCode]);

  const { list, progression } = useFilteredData(data, query, grade, selectedStrand, selectedCode);

  const groupedByStrand = useMemo(() => {
    const groups = {};
    list.forEach((d) => {
      groups[d.strand] = groups[d.strand] || [];
      groups[d.strand].push(d);
    });
    return Object.fromEntries(
      Object.entries(groups).sort(([a], [b]) => {
        const ai = STRAND_ORDER.indexOf(a);
        const bi = STRAND_ORDER.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      })
    );
  }, [list]);

  const stats = useMemo(() => {
    const total = data.length;
    const visible = list.length;
    const gradeCount = new Set(list.map((d) => d.grade)).size;
    const strandCount = new Set(list.map((d) => d.strand)).size;
    return { total, visible, gradeCount, strandCount };
  }, [data, list]);

  const visibleKeys = useMemo(() => list.map((d) => `${d.code}::${d.grade}`), [list]);
  const allVisibleExpanded = visibleKeys.length > 0 && visibleKeys.every((k) => !!expanded[k]);

  const handlePrint = () => window.print();

  const clearFilters = () => {
    setGrade("All Grades");
    setSelectedStrand("All Strands");
    setQuery("");
    setSelectedCode(null);
  };

  const toggleAllVisible = () => {
    setExpanded((prev) => {
      const next = { ...prev };
      visibleKeys.forEach((key) => {
        next[key] = !allVisibleExpanded;
      });
      return next;
    });
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "/" && document.activeElement !== searchInputRef.current) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === "Escape" && document.activeElement === searchInputRef.current) {
        setQuery("");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-screen w-full app-shell">
      <a href="#main-content" className="skip-link">Skip to expectations list</a>
      <div className="hero-glow" aria-hidden="true" />

      <header className="sticky top-0 z-20 border-b border-slate-200/90 bg-white/85 backdrop-blur-md" role="banner">
        <div className="mx-auto max-w-6xl px-4 py-4 lg:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="kicker">Georgia K-12 English Language Arts</p>
              <h1 id="page-title" className="text-2xl font-extrabold tracking-tight text-slate-900 lg:text-3xl">Standards Navigator</h1>
              <p className="mt-1 text-sm text-slate-700">Filter by grade and strand, search by language, and compare cross-grade progression.</p>
              {!loadedFromJson && (
                <p className="mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                  Using sample data. Load full records in <code className="ml-1">data/ga-ela.json</code>.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatCard label="Visible" value={stats.visible} />
              <StatCard label="Total" value={stats.total} />
              <StatCard label="Grades" value={stats.gradeCount} />
              <StatCard label="Strands" value={stats.strandCount} />
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-4 lg:px-6 print:hidden" aria-labelledby="filters-heading">
        <div className="controls-panel rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <h2 id="filters-heading" className="sr-only">Filters and actions</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <div className="md:col-span-2">
              <label htmlFor="search-standards" className="text-xs font-semibold uppercase tracking-wide text-slate-700">Search</label>
              <input
                ref={searchInputRef}
                id="search-standards"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Code, description, details..."
                aria-describedby="search-hint"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-inner shadow-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus-visible:ring-2 focus-visible:ring-sky-300"
              />
              <p id="search-hint" className="sr-only">Type to filter standards and expectations. Press slash to focus this search box and Escape to clear search.</p>
            </div>

            <div>
              <label htmlFor="grade-filter" className="text-xs font-semibold uppercase tracking-wide text-slate-700">Grade</label>
              <select
                id="grade-filter"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                {grades.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="progression-code" className="text-xs font-semibold uppercase tracking-wide text-slate-700">Progression</label>
              <select
                id="progression-code"
                value={selectedCode || ""}
                onChange={(e) => setSelectedCode(e.target.value || null)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                <option value="">No cross-grade focus</option>
                {codeOptions.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">Actions</label>
              <div className="mt-1 flex flex-wrap gap-2">
                <button onClick={toggleAllVisible} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-sky-300">
                  {allVisibleExpanded ? "Collapse Visible" : "Expand Visible"}
                </button>
                <button onClick={clearFilters} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-sky-300">Reset Filters</button>
                <button onClick={handlePrint} className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-900 transition hover:bg-sky-100 focus-visible:ring-2 focus-visible:ring-sky-300">Print View</button>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-200 pt-3">
            <p id="strands-heading" className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-700">Strands</p>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="strands-heading">
              {strands.map((strand) => {
                const selected = selectedStrand === strand;
                const strandColor = STRAND_COLORS[strand]?.chip || "bg-slate-100 text-slate-800 border-slate-200";
                return (
                  <button
                    key={strand}
                    onClick={() => setSelectedStrand(strand)}
                    aria-pressed={selected}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${selected ? strandColor : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
                  >
                    {strand}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {selectedCode && progression && progression.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-2 lg:px-6" aria-labelledby="progression-heading">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="progression-heading" className="text-base font-bold text-slate-900">Cross-Grade Progression</h2>
                <p className="text-sm text-slate-700">
                  Matching entries for <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">{selectedCode}</span>.
                </p>
              </div>
              <button onClick={() => setSelectedCode(null)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-sky-300">Clear progression focus</button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              {progression
                .slice()
                .sort((a, b) => getGradeNumber(a.grade) - getGradeNumber(b.grade))
                .map((d) => (
                  <div key={d.code + d.grade} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">{d.grade}</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-slate-900">{d.code}</p>
                    <p className="mt-1 text-sm text-slate-700">{d.description}</p>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      <main id="main-content" className="mx-auto max-w-6xl px-4 py-4 lg:px-6 print:px-0" role="main" aria-labelledby="page-title">
        <p className="sr-only" aria-live="polite">Showing {list.length} standards and expectations.</p>
        {Object.keys(groupedByStrand).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            No standards or expectations match your filters. Try broadening your search or resetting filters.
          </div>
        ) : (
          Object.entries(groupedByStrand).map(([strand, items], sectionIndex) => {
            const palette = STRAND_COLORS[strand] || { card: "bg-white border-slate-200", accent: "from-slate-200 to-slate-50" };
            const strandHeadingId = `strand-heading-${String(strand).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
            return (
              <section
                key={strand}
                aria-labelledby={strandHeadingId}
                className="mb-8 break-inside-avoid-page reveal"
                style={{ animationDelay: `${sectionIndex * 70}ms` }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 id={strandHeadingId} className="text-lg font-extrabold tracking-tight text-slate-900">{strand}</h2>
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {items.length} item{items.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {items
                    .slice()
                    .sort((a, b) => a.code.localeCompare(b.code))
                    .map((d, cardIndex) => {
                      const expandedKey = `${d.code}::${d.grade}`;
                      const isOpen = !!expanded[expandedKey];

                      return (
                        <article
                          key={d.code + d.grade}
                          className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm reveal ${palette.card}`}
                          style={{ animationDelay: `${70 + cardIndex * 45}ms` }}
                        >
                          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${palette.accent}`} aria-hidden="true" />

                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">{d.grade}</p>
                              <p className="mt-1 font-mono text-sm font-bold text-slate-900">{d.code}</p>
                            </div>
                            <button
                              aria-expanded={isOpen}
                              aria-label={`${isOpen ? "Hide" : "Show"} details for ${d.code} ${d.grade}`}
                              onClick={() => setExpanded((prev) => ({ ...prev, [expandedKey]: !prev[expandedKey] }))}
                              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-sky-300"
                            >
                              {isOpen ? "Hide Details" : "Show Details"}
                            </button>
                          </div>

                          <p className="mt-3 text-[15px] leading-relaxed text-slate-800">{d.description}</p>

                          {isOpen && (
                            <div className="mt-4 grid grid-cols-1 gap-3">
                              <DetailBlock label="Details" text={d.details} />
                              <DetailBlock label="Achievement Level Descriptors" text={d.ALD} />
                              <DetailBlock label="Evidence Notes" text={d.evidence} />
                              <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Sample Items</p>
                                <ul className="mt-1 list-disc pl-5 text-sm leading-relaxed text-slate-800">
                                  {Array.isArray(d.samples) && d.samples.length ? (
                                    d.samples.map((s, i) => <li key={i}>{s}</li>)
                                  ) : (
                                    <li>No sample items provided.</li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}
                </div>
              </section>
            );
          })
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-center text-xs text-slate-700 lg:px-6" role="contentinfo">
        <hr className="my-6 border-slate-200" />
        <p>Georgia ELA Standards Navigator. Replace sample data in <code>data/ga-ela.json</code> for production use.</p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&display=swap');

        :root {
          --paper: #f5f8fb;
        }

        body {
          font-family: 'Manrope', 'Avenir Next', 'Segoe UI', sans-serif;
          background: radial-gradient(circle at 12% -8%, #e0f2fe 0%, rgba(224, 242, 254, 0) 34%),
                      radial-gradient(circle at 88% -4%, #ffedd5 0%, rgba(255, 237, 213, 0) 30%),
                      var(--paper);
          color: #0f172a;
        }

        .app-shell {
          position: relative;
        }

        .hero-glow {
          position: fixed;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.52) 0%, rgba(245, 248, 251, 0) 22%);
          z-index: 0;
        }

        .kicker {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.35rem;
          border-radius: 999px;
          border: 1px solid #dbe3ec;
          background: #ffffff;
          padding: 0.22rem 0.62rem;
          font-size: 0.67rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #334155;
        }

        .controls-panel {
          backdrop-filter: blur(2px);
        }

        .skip-link,
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .skip-link:focus {
          position: fixed;
          width: auto;
          height: auto;
          margin: 0;
          clip: auto;
          inset: 1rem auto auto 1rem;
          z-index: 50;
          border-radius: 0.5rem;
          border: 1px solid #7dd3fc;
          background: #ffffff;
          color: #0f172a;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          font-weight: 700;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
        }

        .reveal {
          animation: riseIn 420ms ease-out both;
        }

        @keyframes riseIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .reveal {
            animation: none !important;
          }
        }

        @media print {
          header,
          .print\\:hidden,
          .hero-glow {
            display: none !important;
          }

          body {
            background: #fff !important;
          }

          main {
            padding: 0 !important;
          }

          section {
            break-inside: avoid-page;
          }

          article {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">{label}</p>
      <p className="mt-0.5 text-lg font-extrabold leading-none text-slate-900">{value}</p>
    </div>
  );
}

function DetailBlock({ label, text }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-800">{text || "No details provided."}</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
