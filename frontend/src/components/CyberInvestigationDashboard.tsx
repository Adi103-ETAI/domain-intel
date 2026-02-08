import * as React from "react";
import { Search, FileDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

import { TopNav } from "@/components/TopNav";
import { RiskAssessmentCard } from "@/components/RiskAssessmentCard";
import { HostingGeoPanel } from "@/components/HostingGeoPanel";
import { DomainIntelligenceCard } from "@/components/DomainIntelligenceCard";
import { SecurityConfigurationCard } from "@/components/SecurityConfigurationCard";
import { CaseReportsExports, type ReportItem } from "@/components/CaseReportsExports";
import { ReportDownloads } from "@/components/ReportDownloads";

// Import the real API client
import { analyzeDomain, generateReport, type AnalysisResponse } from "@/lib/api";

type CaseRow = Tables<"cases">;

export function CyberInvestigationDashboard() {
  const [activeTab, setActiveTab] = React.useState<"Dashboard" | "Active Cases" | "History">("Dashboard");
  const [domain, setDomain] = React.useState("");
  const [analystName, setAnalystName] = React.useState("Det. J. Doe");
  const [caseId, setCaseId] = React.useState("");

  // Analysis state
  const [error, setError] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [result, setResult] = React.useState<AnalysisResponse | null>(null);
  const [shouldFlyTo, setShouldFlyTo] = React.useState(false);

  // PDF generation state
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  // Reports and cases
  const [reports, setReports] = React.useState<ReportItem[]>([]);
  const [cases, setCases] = React.useState<CaseRow[]>([]);
  const [casesLoading, setCasesLoading] = React.useState(false);
  const [casesError, setCasesError] = React.useState<string | null>(null);

  // Cleanup blob URLs on unmount
  React.useEffect(() => {
    return () => {
      for (const r of reports) {
        if (r.url.startsWith("blob:")) URL.revokeObjectURL(r.url);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load cases when Active Cases tab is selected
  React.useEffect(() => {
    if (activeTab !== "Active Cases") return;

    let cancelled = false;
    async function loadCases() {
      setCasesLoading(true);
      setCasesError(null);
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error("Failed to load cases", error);
        setCasesError("Unable to load active cases.");
      } else {
        setCases(data ?? []);
      }
      setCasesLoading(false);
    }

    loadCases();

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  // =========================================================================
  // REAL API CALL - Domain Analysis
  // =========================================================================
  const runAnalysis = async () => {
    const cleaned = domain.trim();
    if (!cleaned) {
      setError("Enter a domain or URL to analyze.");
      setResult(null);
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setShouldFlyTo(false);
    setResult(null);

    try {
      // Call the FastAPI backend
      const data = await analyzeDomain({
        domain: cleaned,
        analyst_name: analystName || "Demo User",
        case_id: caseId || `CASE-${Date.now()}`,
      });

      console.log("✅ Analysis complete:", data);
      setResult(data);
      setShouldFlyTo(true);
    } catch (err: unknown) {
      console.error("❌ Analysis failed:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message || "Failed to analyze domain. Make sure the backend is running on http://localhost:8000");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // =========================================================================
  // REAL API CALL - PDF Report Generation
  // =========================================================================
  const handleDownloadReport = async () => {
    if (!result) return;

    setIsGeneratingPdf(true);
    try {
      const url = await generateReport({
        domain: domain.trim(),
        analyst_name: analystName || "Demo User",
        case_id: caseId || `CASE-${Date.now()}`,
      });

      // Open the PDF in a new tab for download
      window.open(url, "_blank");

      // Also add to the reports list
      const ts = new Date();
      setReports((prev) => [
        {
          id: crypto.randomUUID(),
          fileName: `${domain.replace(/\./g, "_")}_report.pdf`,
          createdAtISO: ts.toISOString(),
          url,
          target: domain.trim(),
          status: "Ready",
          type: "PDF",
        },
        ...prev,
      ]);
    } catch (err: unknown) {
      console.error("❌ PDF generation failed:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      alert("Failed to generate report: " + message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-investigation-grid">
      <TopNav
        active={activeTab}
        onChangeActive={setActiveTab}
        userLabel={analystName || "Det. J. Doe"}
        unitLabel="Cyber Crimes Unit"
      />

      {activeTab === "History" ? (
        <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
          <Card className="surface-elevated">
            <CardContent className="p-6 space-y-3">
              <div className="text-sm font-semibold">Case History</div>
              <div className="text-xs text-muted-foreground">
                Review previously generated reports for completed or archived investigations.
              </div>
            </CardContent>
          </Card>

          <CaseReportsExports items={reports} onGenerate={handleDownloadReport} />

          <div className="text-left text-xs text-muted-foreground">
            Reports are generated from the FastAPI backend using real analysis data.
          </div>
        </main>
      ) : activeTab === "Active Cases" ? (
        <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
          <Card className="surface-elevated">
            <CardContent className="p-6 space-y-3">
              <div className="text-sm font-semibold">Active Cases</div>
              <div className="text-xs text-muted-foreground">
                Monitor ongoing investigations, review status, and quickly jump back into critical targets.
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardContent className="p-0">
              <div className="overflow-hidden rounded-xl border bg-background">
                <div className="hidden grid-cols-12 gap-3 border-b bg-panel px-4 py-3 text-[11px] font-semibold text-muted-foreground sm:grid">
                  <div className="col-span-4">CASE</div>
                  <div className="col-span-3">TARGET</div>
                  <div className="col-span-3">STATUS</div>
                  <div className="col-span-2">OPENED</div>
                </div>

                {casesLoading ? (
                  <div className="p-6 text-left text-sm text-muted-foreground">Loading active cases…</div>
                ) : casesError ? (
                  <div className="p-6 text-left text-sm">
                    <div className="font-medium">Unable to load cases</div>
                    <div className="mt-1 text-xs text-muted-foreground">{casesError}</div>
                  </div>
                ) : cases.length === 0 ? (
                  <div className="p-6 text-left text-sm">
                    <div className="font-medium">No active cases</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      New investigations will appear here once created in the case management view.
                    </div>
                  </div>
                ) : (
                  <ul className="divide-y">
                    {cases.map((c) => (
                      <li key={c.id} className="p-4">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-center sm:gap-3">
                          <div className="sm:col-span-4">
                            <div className="truncate text-xs font-semibold">{c.title}</div>
                            {c.summary ? (
                              <div className="truncate text-[11px] text-muted-foreground">{c.summary}</div>
                            ) : null}
                          </div>
                          <div className="sm:col-span-3">
                            <div className="truncate text-xs font-medium">{c.target || "—"}</div>
                          </div>
                          <div className="sm:col-span-3">
                            <span className="inline-flex items-center rounded-full border bg-panel px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              {c.status}
                            </span>
                          </div>
                          <div className="sm:col-span-2">
                            <div className="text-xs text-muted-foreground">
                              {new Date(c.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      ) : (
        <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
          {/* Search Card */}
          <Card className="surface-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <div className="text-sm font-semibold">New Investigation Query</div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-3">
                  <label
                    className="mb-1.5 block text-[11px] font-semibold tracking-[0.14em] text-muted-foreground"
                    htmlFor="analyst"
                  >
                    ANALYST NAME
                  </label>
                  <Input
                    id="analyst"
                    value={analystName}
                    onChange={(e) => setAnalystName(e.target.value)}
                    placeholder="Det. J. Doe"
                    className="bg-background"
                    autoComplete="off"
                  />
                </div>

                <div className="lg:col-span-3">
                  <label
                    className="mb-1.5 block text-[11px] font-semibold tracking-[0.14em] text-muted-foreground"
                    htmlFor="caseId"
                  >
                    CASE REFERENCE ID
                  </label>
                  <Input
                    id="caseId"
                    value={caseId}
                    onChange={(e) => setCaseId(e.target.value)}
                    placeholder="e.g., CASE-24-001"
                    className="bg-background"
                    autoComplete="off"
                  />
                </div>

                <div className="lg:col-span-4">
                  <label
                    className="mb-1.5 block text-[11px] font-semibold tracking-[0.14em] text-muted-foreground"
                    htmlFor="domain"
                  >
                    TARGET DOMAIN / URL
                  </label>
                  <Input
                    id="domain"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="Enter domain (e.g., suspicious-site.net)"
                    className="bg-background"
                    autoComplete="off"
                    onKeyDown={(e) => e.key === "Enter" && runAnalysis()}
                  />
                </div>

                <div className="lg:col-span-2 lg:flex lg:items-end lg:gap-2">
                  <Button onClick={runAnalysis} disabled={isAnalyzing} className="h-10 flex-1">
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span className="text-[11px] font-semibold tracking-[0.14em]">ANALYZE</span>
                    )}
                  </Button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-left text-sm">
                  <span className="font-medium text-destructive">Error:</span>{" "}
                  <span className="text-muted-foreground">{error}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <section className="grid gap-6 lg:grid-cols-12">
            {/* Risk Assessment Card */}
            <Card className="surface-elevated lg:col-span-4">
              <CardContent className="p-6">
                {result ? (
                  <>
                    <RiskAssessmentCard
                      score={result.risk_assessment.risk_score}
                      level={result.risk_assessment.risk_level}
                      explanation={result.risk_assessment.explanation}
                      reasons={result.risk_assessment.reasons}
                    />
                    {/* Download Report Button */}
                    <Button
                      onClick={handleDownloadReport}
                      disabled={isGeneratingPdf}
                      className="mt-4 w-full"
                      variant="outline"
                    >
                      {isGeneratingPdf ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <FileDown className="h-4 w-4 mr-2" />
                      )}
                      <span className="text-[11px] font-semibold tracking-[0.14em]">
                        {isGeneratingPdf ? "GENERATING..." : "DOWNLOAD PDF"}
                      </span>
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold">Safety Assessment</div>
                    <div className="rounded-xl border bg-panel p-6 text-left">
                      <div className="text-sm font-medium">Awaiting analysis</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Enter a domain and click "ANALYZE" to compute safety score and populate infrastructure details.
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hosting & Geo Panel */}
            <Card className="surface-elevated lg:col-span-8">
              <CardContent className="p-6">
                <HostingGeoPanel
                  targetUrl={domain}
                  flyTo={shouldFlyTo}
                  hostingInfo={result?.hosting_info}
                />
              </CardContent>
            </Card>
          </section>

          {/* Domain & Security Info Section */}
          <section className="grid gap-6 lg:grid-cols-12">
            <Card className="surface-elevated lg:col-span-4">
              <CardContent className="p-6">
                <DomainIntelligenceCard domainInfo={result?.domain_info} />
              </CardContent>
            </Card>

            <Card className="surface-elevated lg:col-span-8">
              <CardContent className="p-6">
                <SecurityConfigurationCard securityInfo={result?.security_info} />
              </CardContent>
            </Card>
          </section>

          <ReportDownloads items={reports} />

          <div className="text-left text-xs text-muted-foreground">
            {result
              ? `✅ Live data from FastAPI backend (${result.domain})`
              : "Data will be fetched from the FastAPI backend when you run an analysis."
            }
          </div>
        </main>
      )}
    </div>
  );
}
