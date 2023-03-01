import { PricesResponse } from "@/lib/supabaseClient";
import { formatDate, formatPrice } from "@/lib/utils";
import React from "react";

import {
  CartesianGrid,
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
    const newData = {
      date: new Date(e.created_at).getTime(),
      stock: e.stock ?? 0,
      price: e.price_in_cents,
    };
    if (!dataMap.get(key)) {
      dataMap.set(key, []);
    }
    dataMap.get(key)!.push(newData);
  });
  return dataMap;
}

function mapToChartData(map: Map<string, ChartUnitData[]>) {
  type ChartData = { name: string; data: ChartUnitData[] };
  const data = Array.from(map.entries())
    .sort()
    .reduce<ChartData[]>((prev, curr) => {
      const [name, data] = curr;
      prev.push({
        name,
        data,
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
    <div className="h-[calc(min(680px,60vh))] w-full">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            type="number"
            tickFormatter={(time) => formatDate(new Date(time))}
            scale="time"
            domain={["auto", "auto"]}
            allowDuplicatedCategory={false}
          />
          <YAxis
            dataKey="stock"
            yAxisId="stock"
            type="number"
            domain={["auto", "auto"]}
          />
          <YAxis
            dataKey="price"
            yAxisId="price"
            orientation="right"
            type="number"
            tickFormatter={(cents) => {
              return formatPrice(cents);
            }}
            domain={["auto", "auto"]}
          />
          <Tooltip content={<CustomTooltip />} />
          {chartData.map((s) => (
            <React.Fragment key={s.name}>
              <Line
                dataKey="stock"
                yAxisId="stock"
                data={s.data}
                name={s.name}
                type="stepAfter"
                dot={false}
                strokeWidth={1.5}
              />
              <Line
                dataKey="price"
                yAxisId="price"
                data={s.data}
                name={s.name}
                type="stepAfter"
                dot={false}
                strokeWidth={1.5}
                stroke="#60cc63"
              />
            </React.Fragment>
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
    const renderedStyles = new Set();

    return (
      <div className="border border-gray-200 bg-white p-3">
        <p className="label mb-1 font-medium">{formatDate(date)}</p>
        <div className="flex flex-col gap-1">
          {payload.map((point, index) => {
            if (renderedStyles.has(point.name)) {
              return null;
            }
            renderedStyles.add(point.name);
            return (
              <div key={index}>{`${point.name}: ${
                point.payload.stock
              } - ${formatPrice(point.payload.price)}`}</div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
