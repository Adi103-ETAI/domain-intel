import * as React from "react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Globe, MapPin, AlertTriangle, Loader2, Shield, Flag, Search } from "lucide-react";
import { getThreatMap, getThreatStats } from "@/lib/api";
import { ThreatMap } from "@/components/ThreatMap";
import { ThreatStatsCharts } from "@/components/ThreatStatsCharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function GlobalThreats() {
    // Search state
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch threat map data with auto-refresh
    const {
        data: mapData,
        isLoading: mapLoading,
        error: mapError,
        refetch: refetchMap,
    } = useQuery({
        queryKey: ["threatMap"],
        queryFn: () => getThreatMap(500),
        staleTime: 1000 * 60 * 5,
        refetchInterval: 30000,
    });

    // Fetch stats data with auto-refresh
    const {
        data: statsData,
        isLoading: statsLoading,
        error: statsError,
        refetch: refetchStats,
    } = useQuery({
        queryKey: ["threatStats"],
        queryFn: getThreatStats,
        staleTime: 1000 * 60 * 5,
        refetchInterval: 30000,
    });

    const isLoading = mapLoading || statsLoading;
    const error = mapError || statsError;

    // Filter threats by search term
    const filteredThreats = useMemo(() => {
        if (!mapData) return [];
        if (!searchTerm.trim()) return mapData;

        return mapData.filter((point) =>
            point.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            point.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [mapData, searchTerm]);

    // Derived stats for cards
    const topRegion = statsData?.by_country?.[0];
    const topType = statsData?.by_type?.[0];

    const handleRefresh = () => {
        refetchMap();
        refetchStats();
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <Flag className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                                🇮🇳 National Cybercrime Surveillance
                                <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-medium">
                                    INDIA
                                </span>
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Real-time cybercrime hotspot monitoring • I4C Integration
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search location (e.g. Jamtara)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 w-[220px] h-9 bg-panel border-border/50 text-sm"
                            />
                        </div>

                        {/* Live Feed Indicator */}
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-500/50 rounded-full">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-medium text-green-400">LIVE</span>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Shield className="h-4 w-4" />
                            )}
                            <span className="ml-2 hidden sm:inline">Refresh</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => (window.location.href = "/")}
                        >
                            ← Dashboard
                        </Button>
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                        <span className="ml-2 text-muted-foreground">
                            Loading threat intelligence...
                        </span>
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <Card className="bg-destructive/10 border-destructive/30">
                        <CardContent className="p-4 text-destructive">
                            Failed to load threat data. Using demo data.
                        </CardContent>
                    </Card>
                )}

                {/* Main Content */}
                {!isLoading && statsData && mapData && (
                    <>
                        {/* Search Results Info */}
                        {searchTerm && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">
                                    Showing results for:
                                </span>
                                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded font-medium">
                                    "{searchTerm}"
                                </span>
                                <span className="text-muted-foreground">
                                    ({filteredThreats.length} of {mapData.length} threats)
                                </span>
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="text-xs text-destructive hover:underline ml-2"
                                >
                                    Clear
                                </button>
                            </div>
                        )}

                        {/* Stats Cards Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Visible Threats (filtered) */}
                            <Card className="surface-elevated border-orange-500/20">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-destructive/10 rounded-xl">
                                            <AlertTriangle className="h-6 w-6 text-destructive" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                                {searchTerm ? "Filtered Threats" : "Active Threats (24h)"}
                                            </p>
                                            <p className="text-3xl font-bold text-foreground">
                                                {searchTerm
                                                    ? filteredThreats.length.toLocaleString()
                                                    : statsData.total_threats.toLocaleString()
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* High Alert Zone */}
                            <Card className="surface-elevated border-warning/30 bg-warning/5">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-warning/20 rounded-xl">
                                            <MapPin className="h-6 w-6 text-warning" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-warning uppercase tracking-wider font-bold flex items-center gap-1">
                                                🚨 High Alert Zone
                                            </p>
                                            <p className="text-2xl font-bold text-foreground">
                                                {topRegion?.country || "N/A"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {topRegion?.count || 0} active cases
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Primary Threat Vector */}
                            <Card className="surface-elevated">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-xl">
                                            <Globe className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                                Top Threat Category
                                            </p>
                                            <p className="text-2xl font-bold text-foreground">
                                                {topType?.type || "N/A"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {topType?.count || 0} incidents reported
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Threat Map */}
                        <Card className="surface-elevated overflow-hidden">
                            <CardContent className="p-0">
                                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                                            🗺️ India Cybercrime Hotspot Map
                                        </h2>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {filteredThreats.length} threat zones displayed
                                        </p>
                                    </div>
                                    <div className="text-xs text-muted-foreground bg-panel px-3 py-1 rounded-full">
                                        Source: NCRP • I4C • State Cyber Cells
                                    </div>
                                </div>
                                <ThreatMap data={filteredThreats} height="520px" />
                            </CardContent>
                        </Card>

                        {/* Stats Charts */}
                        <div>
                            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                📊 State-wise Threat Distribution
                            </h2>
                            <ThreatStatsCharts stats={statsData} />
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
