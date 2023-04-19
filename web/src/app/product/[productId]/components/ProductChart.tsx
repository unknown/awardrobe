import { formatDate, formatPrice } from "@/utils/utils";
import { Fragment, memo } from "react";

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
import { Prices } from "../hooks/types";

export type PricesChartProps = {
  pricesData: Prices[] | null;
};

type ChartUnitData = {
  date: number;
  stock: number;
  price: number;
};

export function ProductChart({ pricesData }: PricesChartProps) {
  const map = pricesToMap(pricesData ?? []);
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
          <YAxis dataKey="stock" yAxisId="stock" type="number" domain={["auto", "auto"]} />
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
            <Fragment key={s.name}>
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
            </Fragment>
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export const MemoizedProductChart = memo(ProductChart);

function pricesToMap(pricesData: Prices[]) {
  const dataMap = new Map<string, ChartUnitData[]>();
  pricesData?.forEach((e) => {
    const key = e.style + "-" + e.size;
    const newData = {
      date: new Date(e.created_at).getTime(),
      stock: e.stock ?? 0,
      price: e.price_in_cents,
    };
    let prices = dataMap.get(key);
    if (!prices) {
      prices = [];
      dataMap.set(key, prices);
    }
    prices.push(newData);
  });
  return dataMap;
}

function mapToChartData(map: Map<string, ChartUnitData[]>) {
  const data = Array.from(map.entries())
    .sort()
    .flatMap((entry) => {
      const [name, data] = entry;
      return {
        name,
        data: data.reverse(),
      };
    });
  return data;
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
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
              <div key={index}>{`${point.name}: ${point.payload.stock} - ${formatPrice(
                point.payload.price
              )}`}</div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
