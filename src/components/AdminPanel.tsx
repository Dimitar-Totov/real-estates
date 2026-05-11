"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Download, Search, Settings } from "lucide-react";
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

const areaSeries = [
  { name: "Sold",   data: [45,  62,  38,  75,  55,  89,  95,  72, 108,  85, 120, 110] },
  { name: "Rented", data: [30,  28,  42,  38,  52,  45,  60,  55,  70,  62,  80,  75] },
  { name: "Listed", data: [80,  95,  72, 110,  88, 130, 145, 118, 160, 130, 180, 165] },
];

const donutOptions: ApexOptions = {
  chart: {
    type: "donut",
    animations: { enabled: true, speed: 900, animateGradually: { enabled: true, delay: 120 } },
    fontFamily: "var(--font-inter), Inter, sans-serif",
  },
  colors: [TEAL, ORANGE, NAVY],
  labels: ["Completed", "In Progress", "Pending"],
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
            label: "Projects",
            color: "#6b7280",
            fontSize: "13px",
            formatter: () => "142",
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

const donutSeries = [55, 30, 15];

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

function UserManagement() {
  return <div className="min-h-[60vh]" />;
}

// ── AdminPanel ────────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const [tab,    setTab]    = useState<"dashboard" | "user-management">("dashboard");
  const [show,   setShow]   = useState(false);
  const [period, setPeriod] = useState<"lifetime" | "monthly">("lifetime");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 80);
    return () => clearTimeout(t);
  }, []);

  const fadeSlide = (delay: number) => ({
    opacity:    show ? 1 : 0,
    transform:  show ? "none" : "translateY(20px)",
    transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
  });

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>

      {/* ── Tab switcher ───────────────────────────────────────────────────── */}
      <div className="flex justify-center py-5 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-2xl p-1.5" style={{ fontFamily: "var(--font-poppins), Poppins, sans-serif" }}>
          {([
            { key: "dashboard",       label: "Dashboard" },
            { key: "user-management", label: "User Management" },
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

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {tab === "user-management" ? <UserManagement /> : (
      <div className="p-4 sm:p-6 lg:p-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 mb-8" style={fadeSlide(0)}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: NAVY }}>RealEstate</h1>
          <p className="text-sm text-gray-400 mt-0.5">Admin Dashboard · Overview &amp; Analytics</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex gap-2 sm:gap-3">
            <StatCard label="Properties" value={284} bg={ORANGE} />
            <StatCard label="Tasks"      value={156} bg={NAVY}   />
            <StatCard label="Members"    value={47}  bg={TEAL}   />
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
            <p className="text-xs text-gray-400 mt-0.5">Full year overview — 2025</p>
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
          <Chart type="donut" series={donutSeries} options={donutOptions} height={280} width="100%" />
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
