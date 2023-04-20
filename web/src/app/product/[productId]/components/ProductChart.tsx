import { formatDate } from "@/utils/utils";
import { Fragment } from "react";
import { Prices } from "../hooks/types";
import { AnimatedAxis, AnimatedGrid, AnimatedLineSeries, Tooltip, XYChart } from "@visx/xychart";
import { curveStepAfter } from "@visx/curve";
import ParentSize from "@visx/responsive/lib/components/ParentSizeModern";

export type PricesChartProps = {
  prices: Prices[] | null;
};

type ChartUnitData = {
  date: string;
  stock: number;
  price: number;
};

const accessors = {
  xAccessor: (d: ChartUnitData) => new Date(d.date),
  yAccessor: (d: ChartUnitData) => d.stock,
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
      date: price.created_at,
      stock: price.stock ?? 0,
      price: price.price_in_cents,
    });
  });

  // ensure even group split and sort data into chronologically
  const groupKeys = Object.keys(groupedPrices);
  groupKeys.forEach((key) => {
    groupedPrices[key] = groupedPrices[key].slice(0, prices.length / groupKeys.length);
    groupedPrices[key].reverse();
  });

  return (
    <div className="h-[calc(min(680px,50vh))] w-full">
      <ParentSize>
        {({ height }) => {
          return (
            <XYChart
              height={height}
              margin={{ left: 40, top: 40, bottom: 40, right: 40 }}
              xScale={{ type: "time" }}
              yScale={{ type: "linear" }}
            >
              <AnimatedGrid
                columns={true}
                lineStyle={{
                  stroke: "#a1a1a1",
                  strokeLinecap: "round",
                  strokeWidth: 1,
                }}
                strokeDasharray="0, 4"
              />

              <AnimatedAxis hideAxisLine hideTicks orientation="bottom" left={30} numTicks={10} />
              <AnimatedAxis hideAxisLine hideTicks orientation="left" numTicks={4} />

              {Object.keys(groupedPrices).map((key) => {
                return (
                  <Fragment key={key}>
                    <AnimatedLineSeries
                      stroke="#008561"
                      dataKey={key}
                      data={groupedPrices[key]}
                      curve={curveStepAfter}
                      {...accessors}
                    />
                  </Fragment>
                );
              })}

              <Tooltip<ChartUnitData>
                showSeriesGlyphs
                showVerticalCrosshair
                snapTooltipToDatumX
                glyphStyle={{
                  fill: "#008561",
                  strokeWidth: 0,
                }}
                renderTooltip={({ tooltipData }) => {
                  if (!tooltipData?.nearestDatum?.datum) return;
                  const date = new Date(tooltipData.nearestDatum.datum.date);

                  return (
                    <div className="flex flex-col gap-1">
                      <h2 className="font-medium">{formatDate(date)}</h2>
                      {Object.entries(tooltipData.datumByKey).map((lineDataArray) => {
                        const [key, value] = lineDataArray;
                        return (
                          <div key={key} className="font-normal">{`${key}: ${accessors.yAccessor(
                            value.datum
                          )}`}</div>
                        );
                      })}
                    </div>
                  );
                }}
              />
            </XYChart>
          );
        }}
      </ParentSize>
    </div>
  );
}
