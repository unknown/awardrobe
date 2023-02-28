import { PricesResponse } from "@/lib/supabaseClient";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";

interface PricesChartProps {
  pricesData: PricesResponse;
}

type ChartUnitData = {
  date: number;
  stock: number;
  price: number;
};

function pricesToMap(pricesData: NonNullable<PricesResponse>) {
  const dataMap = new Map<string, ChartUnitData[]>();
  pricesData.forEach((e) => {
    const key = e.style + "-" + e.size;
    if (!dataMap.get(key)) {
      dataMap.set(key, []);
    }
    dataMap.get(key)!.push({
      date: new Date(e.created_at).getTime(),
      stock: e.stock ?? 0,
      price: e.price_in_cents,
    });
  });
  return dataMap;
}

function mapToChartData(map: Map<string, ChartUnitData[]>) {
  type ChartData = { name: string; data: ChartUnitData[] }[];
  const data = Array.from(map.keys()).reduce<ChartData>((prev, curr) => {
    const data = map.get(curr)!.sort().reverse();
    prev.push({
      name: curr,
      data: data,
    });
    return prev;
  }, []);
  return data;
}

export function PricesChart({ pricesData }: PricesChartProps) {
  if (!pricesData) {
    return null;
  }

  const map = pricesToMap(pricesData);
  const chartData = mapToChartData(map);

  return (
    <div className="h-[calc(min(680px,75vh))] w-full">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            type="number"
            tickFormatter={(time) => new Date(time).toLocaleString()}
            scale="time"
            domain={["auto", "auto"]}
            allowDuplicatedCategory={false}
          />
          <YAxis dataKey="stock" type="number" domain={["auto", "auto"]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {chartData.map((s) => (
            <Line
              dataKey="stock"
              data={s.data}
              name={s.name}
              key={s.name}
              type="monotone"
              dot={false}
              strokeWidth={1.5}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    const date = new Date(label);
    return (
      <div className="border border-gray-200 bg-white p-3">
        <p className="label mb-1 font-medium">{date.toLocaleString()}</p>
        <div className="flex flex-col gap-1">
          {payload.map((point, index) => {
            return <div key={index}>{`${point.name}: ${point.value}`}</div>;
          })}
        </div>
      </div>
    );
  }

  return null;
}
