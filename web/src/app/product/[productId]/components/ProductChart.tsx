import { formatDate, formatPrice } from "@/utils/utils";
import { Fragment, memo, useEffect } from "react";
import { Prices } from "../hooks/types";
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

export type PricesChartProps = {
  prices: Prices[] | null;
};

type ChartUnitData = {
  date: number;
  stock: number;
  price: number;
};

export function ProductChart({ prices }: PricesChartProps) {
  if (prices === null) {
    return <div>Loading...</div>;
  }

  const groupedPrices: Record<string, ChartUnitData[]> = {};
  prices.forEach((price) => {
    const key = price.style + "-" + price.size;
    if (groupedPrices[key] === undefined) {
      groupedPrices[key] = [];
    }
    groupedPrices[key].push({
      date: new Date(price.created_at).getTime(),
      stock: price.stock ?? 0,
      price: price.price_in_cents,
    });
  });

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
          <Tooltip content={<CustomTooltip />} animationDuration={100} />
          {Object.keys(groupedPrices).map((key) => {
            return (
              <Fragment key={key}>
                <Line
                  dataKey="stock"
                  yAxisId="stock"
                  data={groupedPrices[key]}
                  name={key}
                  type="stepAfter"
                  dot={false}
                  strokeWidth={1.5}
                  isAnimationActive={false}
                />
                <Line
                  dataKey="price"
                  yAxisId="price"
                  data={groupedPrices[key]}
                  name={key}
                  type="stepAfter"
                  dot={false}
                  strokeWidth={1.5}
                  stroke="#60cc63"
                  isAnimationActive={false}
                />
              </Fragment>
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export const MemoizedProductChart = memo(ProductChart);

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
              return;
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
