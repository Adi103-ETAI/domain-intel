const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// --- Types based on Backend Pydantic Models ---
export interface AnalysisRequest {
    domain: string;
    analyst_name?: string;
    case_id?: string;
}

export interface RiskAssessment {
    risk_score: number;       // 1.0 to 10.0 (Safety Score)
    risk_level: "LOW" | "MEDIUM" | "HIGH";
    confidence: string;
    reasons: string[];
    explanation: string;
}

export interface DomainInfo {
    registrar?: string;
    creation_date?: string;
    expiry_date?: string;
    domain_age_days?: number;
    nameservers?: string[];
    status?: string[];
}

export interface HostingInfo {
    ip_address?: string;
    country?: string;
    country_code?: string;
    city?: string;
    region?: string;
    isp?: string;
    asn?: string;
    organization?: string;
    hosting_type?: string;
}

export interface SecurityInfo {
    https_enabled: boolean;
    ssl_valid: boolean;
    ssl_issuer?: string;
    ssl_expiry?: string;
    blacklisted: boolean;
    blacklist_sources?: string[];
}

export interface AnalysisResponse {
    domain: string;
    risk_assessment: RiskAssessment;
    domain_info: DomainInfo;
    hosting_info: HostingInfo;
    security_info: SecurityInfo;
}

// --- API Functions ---

export async function analyzeDomain(req: AnalysisRequest): Promise<AnalysisResponse> {
    console.log(`📡 Analyzing domain: ${req.domain} via ${API_BASE}...`);

    const res = await fetch(`${API_BASE}/api/v1/domain/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API Error (${res.status}): ${errorText}`);
    }

    const json = await res.json();
    return json.data; // Unwrap the "data" envelope
}

export async function generateReport(req: AnalysisRequest): Promise<string> {
    console.log(`📄 Generating PDF for: ${req.domain}...`);

    const res = await fetch(`${API_BASE}/api/v1/report/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
    });

    if (!res.ok) {
        throw new Error(`Report Generation Failed: ${await res.text()}`);
    }

    const json = await res.json();
    // Return the full download URL
    return `${API_BASE}${json.data.download_url}`;
}

// --- Utility: Check API Health ---
export async function checkApiHealth(): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE}/`);
        return res.ok;
    } catch {
        return false;
    }
}
