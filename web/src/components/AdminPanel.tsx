"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Download, Search, Settings, Menu, X, LayoutDashboard, Users, UserCheck } from "lucide-react";
import UserManagement from "@/components/UserManagement";
import AgentCandidatesView from "@/components/AgentCandidatesView";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const TEAL   = "#0d9488";
const ORANGE = "#f97316";
const NAVY   = "#1e3a5f";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ── Chart configs ─────────────────────────────────────────────────────────────

const areaOptions: ApexOptions = {
  chart: {
    type: "area",
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: true, speed: 900 },
    fontFamily: "var(--font-inter), Inter, sans-serif",
  },
  colors: [TEAL, ORANGE, NAVY],
  stroke: { curve: "smooth", width: 2.5 },
  fill: {
    type: "gradient",
    gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 100] },
  },
  markers: { size: 4, fillOpacity: 1, strokeWidth: 2, hover: { size: 6 } },
  xaxis: {
    categories: MONTHS,
    labels: { style: { colors: "#9ca3af", fontSize: "11px" } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { labels: { style: { colors: "#9ca3af", fontSize: "10px" } } },
  grid: { borderColor: "#e5e7eb", strokeDashArray: 4, padding: { left: 4, right: 4 } },
  legend: {
    position: "bottom",
    horizontalAlign: "center",
    labels: { colors: "#6b7280" },
    markers: { size: 6 },
    itemMargin: { horizontal: 12 },
  },
  tooltip: { shared: true, intersect: false },
  dataLabels: { enabled: false },
};


function buildDonutOptions(total: number): ApexOptions {
  return {
    chart: {
      type: "donut",
      animations: { enabled: true, speed: 900, animateGradually: { enabled: true, delay: 120 } },
      fontFamily: "var(--font-inter), Inter, sans-serif",
    },
    colors: [TEAL, ORANGE],
    labels: ["For Sale", "For Rent"],
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            name: { show: true, color: "#6b7280", fontSize: "13px", offsetY: 20 },
            value: { show: true, color: "#111827", fontSize: "26px", fontWeight: "800", offsetY: -14 },
            total: {
              show: true,
              label: "Properties",
              color: "#6b7280",
              fontSize: "13px",
              formatter: () => String(total),
            },
          },
        },
      },
    },
    legend: {
      position: "bottom",
      labels: { colors: "#6b7280" },
      markers: { size: 6 },
      itemMargin: { vertical: 4 },
    },
    dataLabels: { enabled: false },
    stroke: { show: false },
    tooltip: { style: { fontFamily: "var(--font-inter), Inter, sans-serif" } },
  };
}

function radialOptions(color: string, label: string): ApexOptions {
  return {
    chart: {
      type: "radialBar",
      animations: { enabled: true, speed: 1200 },
      fontFamily: "var(--font-inter), Inter, sans-serif",
    },
    colors: [color],
    plotOptions: {
      radialBar: {
        hollow: { size: "62%" },
        track: { background: "#f3f4f6", strokeWidth: "100%" },
        dataLabels: {
          name: {
            show: true,
            fontSize: "11px",
            color: "#9ca3af",
            offsetY: 18,
          },
          value: {
            show: true,
            fontSize: "20px",
            fontWeight: "800",
            color: "#111827",
            offsetY: -8,
            formatter: (v) => `${v}%`,
          },
        },
      },
    },
    labels: [label],
    stroke: { lineCap: "round" },
  };
}

const miniAreaOptions: ApexOptions = {
  chart: {
    type: "area",
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: true, speed: 900 },
    fontFamily: "var(--font-inter), Inter, sans-serif",
    sparkline: { enabled: false },
  },
  colors: [TEAL],
  stroke: { curve: "smooth", width: 2.5 },
  fill: {
    type: "gradient",
    gradient: { shadeIntensity: 1, opacityFrom: 0.30, opacityTo: 0.00, stops: [0, 100] },
  },
  markers: { size: 3, fillOpacity: 1, strokeWidth: 1.5, hover: { size: 5 } },
  xaxis: {
    categories: MONTHS,
    labels: { style: { colors: "#9ca3af", fontSize: "9px" } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { show: false },
  grid: { show: false, padding: { left: 0, right: 0 } },
  dataLabels: { enabled: false },
  tooltip: { shared: true, intersect: false },
};

const miniSeries = [
  { name: "Visitors", data: [30, 55, 40, 70, 52, 90, 65, 110, 75, 130, 95, 145] },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, bg }: { label: string; value: number; bg: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl px-5 py-4 text-white min-w-[100px]" style={{ backgroundColor: bg }}>
      <span className="text-3xl font-extrabold leading-none">{value}</span>
      <span className="text-xs font-medium opacity-80 mt-1">{label}</span>
    </div>
  );
}

// ── UserManagement ────────────────────────────────────────────────────────────

// ── AdminPanel ────────────────────────────────────────────────────────────────

type DashboardStats = { properties: number; agents: number; users: number; forSale: number; forRent: number };
type MonthlyData = { year: number; sold: number[]; rented: number[]; listed: number[] };

const ZERO_12 = Array(12).fill(0);

export default function AdminPanel() {
  const [tab,         setTab]         = useState<"dashboard" | "user-management" | "agent-candidates">("dashboard");
  const [show,        setShow]        = useState(false);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [period,      setPeriod]      = useState<"lifetime" | "monthly">("lifetime");
  const [search,      setSearch]      = useState("");
  const [stats,       setStats]       = useState<DashboardStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setStats(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/admin/monthly-properties")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setMonthlyData(data); })
      .catch(() => {});
  }, []);

  const areaSeries = [
    { name: "Sold",   data: monthlyData?.sold   ?? ZERO_12 },
    { name: "Rented", data: monthlyData?.rented  ?? ZERO_12 },
    { name: "Listed", data: monthlyData?.listed  ?? ZERO_12 },
  ];

  const fadeSlide = (delay: number) => ({
    opacity:    show ? 1 : 0,
    transform:  show ? "none" : "translateY(20px)",
    transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
  });

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <style>{`@keyframes ap-fade { from { opacity:0 } to { opacity:1 } }`}</style>

      {/* ── Tab switcher ───────────────────────────────────────────────────── */}

      {/* Desktop pill tabs */}
      <div className="hidden sm:flex justify-center py-5 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-2xl p-1.5" style={{ fontFamily: "var(--font-poppins), Poppins, sans-serif" }}>
          {([
            { key: "dashboard",        label: "Dashboard" },
            { key: "user-management",  label: "User Management" },
            { key: "agent-candidates", label: "Agent Candidates" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200 whitespace-nowrap"
              style={
                tab === key
                  ? { backgroundColor: NAVY, color: "white", boxShadow: "0 4px 14px rgba(30,58,95,0.35)" }
                  : { color: "#6b7280" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="sm:hidden flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-white">
        <span className="font-bold text-base" style={{ color: NAVY, fontFamily: "var(--font-poppins), Poppins, sans-serif" }}>
          {tab === "dashboard" ? "Dashboard" : tab === "user-management" ? "User Management" : "Agent Candidates"}
        </span>
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 active:scale-95 transition-transform"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <div
          className="sm:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          style={{ animation: "ap-fade 0.2s ease both" }}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className="sm:hidden fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col"
        style={{
          width: 270,
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.32s cubic-bezier(0.22,1,0.36,1)",
          fontFamily: "var(--font-poppins), Poppins, sans-serif",
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <span className="font-extrabold text-base" style={{ color: NAVY }}>Admin Panel</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 active:scale-95 transition-transform"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer nav items */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {([
            { key: "dashboard",        label: "Dashboard",        Icon: LayoutDashboard },
            { key: "user-management",  label: "User Management",  Icon: Users           },
            { key: "agent-candidates", label: "Agent Candidates", Icon: UserCheck        },
          ] as const).map(({ key, label, Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => { setTab(key); setDrawerOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-sm font-semibold text-left transition-all duration-200 active:scale-[0.97]"
                style={
                  active
                    ? { backgroundColor: NAVY, color: "white", boxShadow: "0 4px 14px rgba(30,58,95,0.25)" }
                    : { color: "#6b7280" }
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {tab === "user-management" ? <UserManagement /> : tab === "agent-candidates" ? (
        <AgentCandidatesView />
      ) : (
      <div className="p-4 sm:p-6 lg:p-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 mb-8" style={fadeSlide(0)}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: NAVY }}>RealEstate</h1>
          <p className="text-sm text-gray-400 mt-0.5">Admin Dashboard · Overview &amp; Analytics</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex gap-2 sm:gap-3">
            <StatCard label="Properties" value={stats?.properties ?? 0} bg={ORANGE} />
            <StatCard label="Agents"     value={stats?.agents     ?? 0} bg={NAVY}   />
            <StatCard label="Users"      value={stats?.users      ?? 0} bg={TEAL}   />
          </div>
          <button
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-md hover:shadow-lg hover:brightness-110 active:scale-95 transition-all duration-200 whitespace-nowrap"
            style={{ backgroundColor: TEAL }}
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>
      </div>

      {/* ── Main two-column ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Area chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300" style={fadeSlide(0.1)}>
          <div className="mb-2">
            <h2 className="text-base font-bold text-gray-800">Monthly Properties</h2>
            <p className="text-xs text-gray-400 mt-0.5">Full year overview — {monthlyData?.year ?? new Date().getFullYear()}</p>
          </div>
          <Chart type="area" series={areaSeries} options={areaOptions} height={260} width="100%" />
        </div>

        {/* Donut chart */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300" style={fadeSlide(0.2)}>
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-base font-bold text-gray-800">Project Overview</h2>
              <p className="text-xs text-gray-400 mt-0.5">Current project status</p>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors mt-0.5">
              <Settings className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <Chart
            type="donut"
            series={[stats?.forSale ?? 0, stats?.forRent ?? 0]}
            options={buildDonutOptions(stats?.properties ?? 0)}
            height={280}
            width="100%"
          />
        </div>
      </div>

      {/* ── Property Analytics ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100" style={fadeSlide(0.3)}>
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-gray-800">Property Analytics</h2>
            <p className="text-xs text-gray-400 mt-0.5">Track profit, payments &amp; visitor trends</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="bg-transparent outline-none text-gray-700 placeholder-gray-300 w-24 text-sm"
              />
            </label>
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              {(["lifetime", "monthly"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-200"
                  style={
                    period === p
                      ? { backgroundColor: TEAL, color: "white", boxShadow: "0 2px 8px rgba(13,148,136,0.3)" }
                      : { color: "#6b7280" }
                  }
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Three sub-sections */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Profit gauge */}
          <div className="flex flex-col items-center bg-gray-50 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-1">Profit</p>
            <Chart type="radialBar" series={[68]} options={radialOptions(TEAL, "Profit")} height={200} width="100%" />
            <p className="text-xs text-gray-400 text-center mt-1">$124,500 · <span style={{ color: TEAL }}>↑ 12.4%</span> vs last period</p>
          </div>

          {/* Payments gauge */}
          <div className="flex flex-col items-center bg-gray-50 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-1">Total Payments</p>
            <Chart type="radialBar" series={[82]} options={radialOptions(ORANGE, "Collected")} height={200} width="100%" />
            <p className="text-xs text-gray-400 text-center mt-1">$98,300 collected · Tax: $14,250</p>
          </div>

          {/* Mini area chart */}
          <div className="flex flex-col bg-gray-50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-gray-700">Visitor Analytics</p>
              <span className="text-xs font-bold" style={{ color: TEAL }}>↑ 8.2%</span>
            </div>
            <Chart type="area" series={miniSeries} options={miniAreaOptions} height={160} width="100%" />
            <p className="text-xs text-gray-400 px-1">Monthly visitors — 2025</p>
          </div>
        </div>
      </div>
      </div>
      )}
    </div>
  );
}
