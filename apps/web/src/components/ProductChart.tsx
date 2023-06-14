import { curveStepAfter } from "@visx/curve";
import { ParentSize } from "@visx/responsive";
import { AnimatedAxis, AnimatedGrid, AnimatedLineSeries, Tooltip, XYChart } from "@visx/xychart";

import { PriceWithVariants } from "@/hooks/usePrices";
import { formatDate } from "@/utils/utils";

export type PricesChartProps = {
  prices: PriceWithVariants[] | null;
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
    const key = price.variants.map((variant) => variant.value).join("-");
    if (groupedPrices[key] === undefined) {
      groupedPrices[key] = [];
    }
    groupedPrices[key].push({
      date: price.timestamp.toString(), //TODO: fix this! prisma thinks timestamp is a date, but it's not
      stock: price.stock ?? 0,
      price: price.priceInCents,
    });
  });

  // ensure equal group lengths and sort data chronologically
  const groupKeys = Object.keys(groupedPrices);
  const groupSize = prices.length / groupKeys.length;
  groupKeys.forEach((key) => {
    groupedPrices[key] = groupedPrices[key].slice(0, groupSize).reverse();
  });

  return (
    <ParentSize>
      {({ height }) => {
        return (
          <XYChart
            height={Math.min(600, height)}
            xScale={{ type: "time" }}
            yScale={{ type: "linear" }}
          >
            <AnimatedGrid
              lineStyle={{
                stroke: "#a1a1a1",
                strokeLinecap: "round",
                strokeWidth: 1,
              }}
              strokeDasharray="0, 4"
            />

            <AnimatedAxis hideAxisLine hideTicks orientation="bottom" />
            <AnimatedAxis hideAxisLine hideTicks orientation="left" />

            {Object.keys(groupedPrices).map((key) => {
              return (
                <AnimatedLineSeries
                  key={key}
                  dataKey={key}
                  data={groupedPrices[key]}
                  stroke="#008561"
                  curve={curveStepAfter}
                  {...accessors}
                />
              );
            })}

            <Tooltip<ChartUnitData>
              showSeriesGlyphs
              showVerticalCrosshair
              snapTooltipToDatumX
              glyphStyle={{
                fill: "#008561",
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
  );
}
