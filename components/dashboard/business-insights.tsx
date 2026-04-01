"use client";

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface Props {
  dailyTrend: { date: string; count: number }[];
  hourCounts: number[];
  responseQualityPct: number;
  leadConversionPct: number;
}

export function BusinessInsights({ dailyTrend, hourCounts, responseQualityPct, leadConversionPct }: Props) {
  const peakData = hourCounts.map((count, hour) => ({ hour: `${hour}:00`, count }));

  return (
    <div className="mt-10 space-y-6">
      <h2 className="text-lg font-semibold text-white">Business Insights</h2>

      {/* Stat cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="p-6 rounded-2xl border border-border bg-surface shadow-card">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Response Quality Score</p>
          <p className="text-4xl font-display font-bold text-primary">{responseQualityPct}%</p>
          <p className="text-xs text-slate-500 mt-1">Sessions with a confident answer</p>
        </div>
        <div className="p-6 rounded-2xl border border-border bg-surface shadow-card">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Lead Conversion Rate</p>
          <p className="text-4xl font-display font-bold text-secondary">{leadConversionPct}%</p>
          <p className="text-xs text-slate-500 mt-1">Sessions where a lead was captured</p>
        </div>
      </div>

      {/* 30-day trend */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-card">
        <h3 className="text-sm font-semibold text-white mb-4">30-Day Conversation Trend</h3>
        {dailyTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailyTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#f8fafc" }} itemStyle={{ color: "#3b82f6" }} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} name="Conversations" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-slate-500 text-sm">No data for the last 30 days</div>
        )}
      </div>

      {/* Peak hours */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-card">
        <h3 className="text-sm font-semibold text-white mb-4">Peak Activity Hours</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={peakData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#f8fafc" }} itemStyle={{ color: "#8b5cf6" }} />
            <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Conversations" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
