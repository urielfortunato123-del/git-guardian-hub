import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import type { TimelineEntry } from "@/data/mockPoliticians";

interface Props {
  data: TimelineEntry[];
}

export function TimelineChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 20%)" />
        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(220 10% 55%)" }} />
        <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 55%)" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(220 14% 13%)",
            border: "1px solid hsl(220 14% 20%)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="presencas" name="Presenças" fill="hsl(212 92% 58%)" radius={[2, 2, 0, 0]} />
        <Bar dataKey="ausencias" name="Ausências" fill="hsl(0 72% 56%)" radius={[2, 2, 0, 0]} />
        <Bar dataKey="votacoes" name="Votações" fill="hsl(160 84% 46%)" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
