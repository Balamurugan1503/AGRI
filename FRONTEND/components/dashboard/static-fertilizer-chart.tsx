"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

// Data manually transcribed from your fertilizer_dataset.csv to serve as a static example
const FERTILIZER_DATA = [
    { name: "Urea", count: 22 },
    { name: "DAP", count: 18 },
    { name: "28-28", count: 17 },
    { name: "14-35-14", count: 14 },
    { name: "20-20", count: 14 },
    { name: "17-17-17", count: 8 },
    { name: "10-26-26", count: 6 }
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF4560", "#A239EA"];

export function StaticFertilizerChart() {
  const total = useMemo(() => FERTILIZER_DATA.reduce((sum, entry) => sum + entry.count, 0), []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Fertilizer Distribution
        </CardTitle>
        <CardDescription>
          A visualization of fertilizer usage among farmers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height: 250 }}>
          <ResponsiveContainer>
            {/* --- MODIFIED: Adjusted PieChart margins to reduce space --- */}
            <PieChart margin={{ top: 20, right: 60, left: 0, bottom: 20 }}>
              {/* --- MODIFIED: Removed innerRadius to make it a Pie Chart --- */}
              <Pie
                data={FERTILIZER_DATA}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={90} // Slightly increased radius for better visuals
                fill="#8884d8"
                dataKey="count"
                nameKey="name"
                paddingAngle={2}
              >
                {FERTILIZER_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => {
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                  return `${value} predictions (${percentage}%)`;
                }}
                contentStyle={{
                  background: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right" 
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}