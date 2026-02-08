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

// --- Scan History Types ---
export interface ScanHistoryItem {
    id: number;
    domain: string;
    risk_score: number;
    risk_level: "LOW" | "MEDIUM" | "HIGH";
    scan_date: string;  // ISO string
    analyst_name?: string;
    case_id?: string;
}

// --- Fetch Scan History from Backend ---
export async function getScanHistory(limit: number = 50): Promise<ScanHistoryItem[]> {
    const res = await fetch(`${API_BASE}/api/v1/domain/history?limit=${limit}`);

    if (!res.ok) {
        throw new Error(`Failed to fetch history: ${await res.text()}`);
    }

    const json = await res.json();
    return json.data;  // Backend returns { status, count, data: [...] }
}

// =====================================================
// AUTHENTICATION
// =====================================================

// --- Auth Types ---
export interface LoginPayload {
    email: string;
    password: string;
}

export interface SignupPayload {
    email: string;
    password: string;
    fullName: string;
    organization: string;
}

export interface AuthResponse {
    token: string;
    message: string;
    user_name: string;
    organization: string;
}

// --- Auth API Functions ---
export async function login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Login failed" }));
        throw new Error(err.detail || "Invalid credentials");
    }
    const data: AuthResponse = await res.json();

    // Save user details to localStorage
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, data.user_name);
    localStorage.setItem(ORG_KEY, data.organization);

    return data;
}

export async function signup(payload: SignupPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/api/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Signup failed" }));
        throw new Error(err.detail || "Could not create account");
    }
    const data: AuthResponse = await res.json();

    // Save user details to localStorage
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, data.user_name);
    localStorage.setItem(ORG_KEY, data.organization);

    return data;
}

// --- Auth Helper Functions ---
const TOKEN_KEY = "cybertrace_token";
const USER_KEY = "cybertrace_user";
const ORG_KEY = "cybertrace_org";

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
    const token = getToken();
    if (!token) return false;

    // Optionally check token expiry (JWT contains exp claim)
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000; // Convert to milliseconds
        return Date.now() < exp;
    } catch {
        return false;
    }
}

export function logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ORG_KEY);
}

export function getUserDetails(): { name: string; org: string } {
    return {
        name: localStorage.getItem(USER_KEY) || "Unknown Agent",
        org: localStorage.getItem(ORG_KEY) || "Cyber Cell"
    };
}

export function getAuthHeader(): Record<string, string> {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}
