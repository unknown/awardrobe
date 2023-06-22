import { curveStepAfter } from "@visx/curve";
import { Axis, Grid, LineSeries, Tooltip, XYChart } from "@visx/xychart";

import { PriceWithVariant } from "@/hooks/usePrices";
import { formatDate } from "@/utils/utils";

export type PricesChartProps = {
  prices: PriceWithVariant[] | null;
};

type ChartUnitData = {
  date: string;
  price: number;
};

const accessors = {
  xAccessor: (d: ChartUnitData) => new Date(d.date),
  yAccessor: (d: ChartUnitData) => d.price,
};

export function ProductChart({ prices }: PricesChartProps) {
  if (prices === null) {
    return <div>Loading...</div>;
  }

  const groupedPrices: Record<string, ChartUnitData[]> = {};
  prices.forEach((price) => {
    const key = `${price.productVariant.style}-${price.productVariant.size}`;
    if (groupedPrices[key] === undefined) {
      groupedPrices[key] = [];
    }
    groupedPrices[key].push({
      date: price.timestamp.toString(),
      price: price.priceInCents,
    });
  });

  // ensure equal group lengths, sort data chronologically, and add a data point for "now"
  const groupKeys = Object.keys(groupedPrices);
  const groupSize = prices.length / groupKeys.length;
  const currentDate = new Date();
  groupKeys.forEach((key) => {
    groupedPrices[key] = groupedPrices[key].slice(0, groupSize).reverse();

    const lastPrice = { ...groupedPrices[key].slice(-1)[0] };
    lastPrice.date = currentDate.toString();
    groupedPrices[key].push(lastPrice);
  });

  return (
    <XYChart xScale={{ type: "time" }} yScale={{ type: "linear" }}>
      <Grid
        lineStyle={{
          stroke: "#a1a1a1",
          strokeLinecap: "round",
          strokeWidth: 1,
          strokeDasharray: "2, 4",
        }}
      />

      <Axis hideTicks orientation="bottom" strokeWidth={1} />
      <Axis hideTicks orientation="left" strokeWidth={1} />

      {Object.keys(groupedPrices).map((key) => {
        return (
          <LineSeries
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
}
