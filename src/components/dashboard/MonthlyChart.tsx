import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MonthlyData {
  month: string;
  total: number;
  low: number;
  medium: number;
  high: number;
}

interface MonthlyChartProps {
  analyses: Array<{
    created_at: string;
    status: string;
    risk_level: string | null;
  }>;
}

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export function MonthlyChart({ analyses }: MonthlyChartProps) {
  const data = useMemo<MonthlyData[]>(() => {
    const now = new Date();
    const months: MonthlyData[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const filtered = analyses.filter((a) => a.created_at.startsWith(key));

      months.push({
        month: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
        total: filtered.length,
        low: filtered.filter((a) => a.risk_level === "low").length,
        medium: filtered.filter((a) => a.risk_level === "medium").length,
        high: filtered.filter((a) => a.risk_level === "high").length,
      });
    }
    return months;
  }, [analyses]);

  return (
    <div className="academic-card p-6">
      <div className="mb-4">
        <h2 className="text-lg font-display font-semibold">Evolução Mensal</h2>
        <p className="text-sm text-muted-foreground">Análises nos últimos 6 meses</p>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.08)",
              }}
            />
            <Legend
              formatter={(value) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
            <Bar dataKey="low" name="Baixo Risco" stackId="risk" fill="hsl(142, 71%, 45%)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="medium" name="Médio Risco" stackId="risk" fill="hsl(38, 92%, 50%)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="high" name="Alto Risco" stackId="risk" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
