import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface RiskDistributionProps {
  distribution?: { low: number; medium: number; high: number };
}

export function RiskDistribution({ distribution }: RiskDistributionProps) {
  const low = distribution?.low ?? 0;
  const medium = distribution?.medium ?? 0;
  const high = distribution?.high ?? 0;
  const hasData = low + medium + high > 0;

  const data = [
    { name: "Baixo Risco", value: low, color: "hsl(142, 71%, 45%)" },
    { name: "Médio Risco", value: medium, color: "hsl(38, 92%, 50%)" },
    { name: "Alto Risco", value: high, color: "hsl(0, 72%, 51%)" },
  ];

  return (
    <div className="academic-card p-6">
      <div className="mb-4">
        <h2 className="text-lg font-display font-semibold">Distribuição de Risco</h2>
        <p className="text-sm text-muted-foreground">Classificação das análises concluídas</p>
      </div>

      {!hasData ? (
        <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
          Sem dados de análises concluídas
        </div>
      ) : (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.08)",
                  }}
                  formatter={(value: number) => [`${value}%`, "Percentagem"]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-sm text-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
            {data.map((item) => (
              <div key={item.name} className="text-center">
                <p className="text-2xl font-bold font-display" style={{ color: item.color }}>
                  {item.value}%
                </p>
                <p className="text-xs text-muted-foreground">{item.name.split(" ")[0]}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
