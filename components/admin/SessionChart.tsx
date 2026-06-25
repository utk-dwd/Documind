"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PERIODS = [
  { key: "day" as const, label: "30D", limit: 30 },
  { key: "week" as const, label: "12W", limit: 12 },
  { key: "month" as const, label: "12M", limit: 12 },
];

type Period = "day" | "week" | "month";

interface DataPoint {
  label: string;
  count: number;
}

export function SessionChart() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [period, setPeriod] = useState<Period>("day");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const cfg = PERIODS.find((p) => p.key === period)!;
    fetch(`/api/admin/analytics/sessions?period=${cfg.key}&limit=${cfg.limit}`)
      .then((res) => res.json())
      .then((json) => setData(json.data || []))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-600">
          Chat Sessions
        </CardTitle>
        <div className="flex gap-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                period === p.key
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : data.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-zinc-400">
            No session data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 5, right: 12, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e4e4e7",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#18181b"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: "#18181b" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
