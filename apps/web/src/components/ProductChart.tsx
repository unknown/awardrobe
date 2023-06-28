import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveStepAfter } from "@visx/curve";
import { localPoint } from "@visx/event";
import { LinearGradient } from "@visx/gradient";
import { GridColumns, GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { scaleLinear, scaleTime } from "@visx/scale";
import { AreaClosed, Bar, Line, LinePath } from "@visx/shape";
import { TooltipWithBounds, useTooltip } from "@visx/tooltip";
import { bisector, extent } from "d3-array";

import { Price } from "@awardrobe/prisma-types";

import { formatCurrency, formatDate } from "@/utils/utils";

export type PricesChartProps = {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  prices: Price[] | null;
};

type ChartUnitData = {
  date: string;
  price: number;
  stock: number;
};

// accessors
const dateBisector = bisector<ChartUnitData, Date>((d) => new Date(d.date)).left;
const dateAccessor = (d: ChartUnitData) => new Date(d.date);
const priceAccessor = (d: ChartUnitData) => d.price;
const stockAccessor = (d: ChartUnitData) => d.stock;

const defaultMargin = { top: 40, right: 30, bottom: 50, left: 50 };

export function ProductChart({
  width,
  height,
  margin = defaultMargin,
  prices: consumerPrices,
}: PricesChartProps) {
  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
    useTooltip<ChartUnitData>();

  // bounds
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  if (innerWidth === 0 || innerHeight === 0) return null;

  if (consumerPrices === null) {
    return <div>Loading...</div>;
  }

  const lastPrice = consumerPrices[consumerPrices.length - 1];
  if (!lastPrice) return <div>No price data</div>;

  const prices = [...consumerPrices, { ...lastPrice, timestamp: new Date().toISOString() }].map(
    (price) => ({
      date: price.timestamp.toString(),
      price: price.priceInCents,
      stock: price.inStock ? 1 : 0,
    }),
  );

  // scales
  const timeScale = scaleTime<number>({
    range: [0, innerWidth],
    domain: extent(prices, dateAccessor) as [Date, Date],
  });
  const priceExtent = extent(prices, priceAccessor) as [number, number];
  const priceScale = scaleLinear<number>({
    range: [innerHeight, 0],
    domain: [priceExtent[0] - 50, priceExtent[1] + 50],
  });
  const stockScale = scaleLinear<number>({
    range: [innerHeight, 0],
    domain: [0, 1],
  });

  const handleTooltip = (event: React.TouchEvent<SVGElement> | React.MouseEvent<SVGElement>) => {
    const coords = localPoint(event) ?? { x: 0, y: 0 };
    const invertedDate = timeScale.invert(coords.x - margin.left);
    const index = dateBisector(prices, invertedDate, 1);
    const price = prices[index - 1];

    if (!price) return;
    const data = {
      ...price,
      date: invertedDate.toISOString(),
    };

    showTooltip({
      tooltipLeft: coords.x,
      tooltipTop: coords.y,
      tooltipData: data,
    });
  };

  return (
    <div className="relative">
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          <LinearGradient id="area-gradient" from="#edffea" to="#edffea" toOpacity={0.1} />
          <AreaClosed<ChartUnitData>
            data={prices}
            x={(d) => timeScale(dateAccessor(d))}
            y={(d) => stockScale(stockAccessor(d))}
            yScale={stockScale}
            curve={curveStepAfter}
            strokeWidth={1}
            stroke="#398739"
            fill="url(#area-gradient)"
          />
          <AxisLeft
            scale={priceScale}
            tickLabelProps={{ fontSize: 12 }}
            tickFormat={(value) => formatCurrency(value.valueOf())}
            hideTicks
            hideAxisLine
          />
          <AxisBottom
            top={innerHeight}
            scale={timeScale}
            tickLabelProps={{ fontSize: 12 }}
            numTicks={Math.min(10, innerWidth / 80)}
            hideTicks
            hideAxisLine
          />
          <GridRows scale={priceScale} width={innerWidth} height={innerHeight} stroke="#e0e0e0" />
          <GridColumns scale={timeScale} width={innerWidth} height={innerHeight} stroke="#e0e0e0" />
          <LinePath<ChartUnitData>
            data={prices}
            x={(d) => timeScale(dateAccessor(d))}
            y={(d) => priceScale(priceAccessor(d))}
            curve={curveStepAfter}
            strokeWidth={2}
            stroke="#2b8bad"
          />
          <Bar
            width={innerWidth}
            height={innerHeight}
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={() => hideTooltip()}
            onTouchEnd={() => hideTooltip()}
            fill="transparent"
            stroke="#e0e0e0"
            strokeWidth={2}
          />
        </Group>
        {tooltipData && (
          <g>
            <Line
              from={{ x: tooltipLeft, y: margin.top }}
              to={{ x: tooltipLeft, y: margin.top + innerHeight }}
              stroke="#c0c0c0"
              strokeWidth={2}
              pointerEvents="none"
              strokeDasharray="5,2"
            />
          </g>
        )}
      </svg>
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          className="border-border absolute space-y-1 rounded-md border bg-white p-3 shadow-lg"
          style={{}}
          key={Math.random()}
          top={tooltipTop}
          left={tooltipLeft}
        >
          {!stockAccessor(tooltipData) ? (
            <p className="text-sm font-bold">Out of stock</p>
          ) : undefined}
          <p className="text-sm">Price: {formatCurrency(priceAccessor(tooltipData))}</p>
          <p className="text-[12px]">{formatDate(new Date(dateAccessor(tooltipData)))}</p>
        </TooltipWithBounds>
      )}
    </div>
  );
}
