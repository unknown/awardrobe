import { Fragment } from "react";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveStepAfter } from "@visx/curve";
import { localPoint } from "@visx/event";
import { LinearGradient } from "@visx/gradient";
import { GridColumns, GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { scaleLinear, scaleTime } from "@visx/scale";
import { AreaClosed, Bar, Line, LinePath } from "@visx/shape";
import { TooltipWithBounds, useTooltip } from "@visx/tooltip";
import { bisector, extent } from "d3-array";

import { Price } from "@awardrobe/prisma-types";

import { formatCurrency, formatDate } from "@/utils/utils";

export type PricesChartProps = {
  prices: Price[] | null;
};

type ChartComponentProps = {
  prices: ChartUnit[];
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
};

type ChartUnit = {
  date: string;
  price: number;
  stock: number;
};

// accessors
const dateBisector = bisector<ChartUnit, Date>((d) => new Date(d.date)).left;
const dateAccessor = (d: ChartUnit) => new Date(d.date);
const priceAccessor = (d: ChartUnit) => d.price;
const stockAccessor = (d: ChartUnit) => d.stock;

const defaultMargin = { top: 40, right: 30, bottom: 50, left: 50 };

export function ProductChart({ prices: consumerPrices }: PricesChartProps) {
  if (consumerPrices === null) {
    return (
      <div className="relative h-full w-full">
        <p className="text-muted-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          Loading...
        </p>
      </div>
    );
  }

  const lastPrice = consumerPrices[consumerPrices.length - 1];
  if (!lastPrice) {
    const lineProps = {
      stroke: "#e0e0e0",
      strokeWidth: 1,
      shapeRendering: "crispEdges",
    };

    return (
      <div className="relative flex h-full w-full items-center justify-center">
        <svg className="absolute -z-10 h-full w-full overflow-visible p-8">
          <g {...lineProps}>
            <line x1="0%" x2="100%" y1="0%" y2="0%" />
            <line x1="0%" x2="100%" y1="10%" y2="10%" />
            <line x1="0%" x2="100%" y1="20%" y2="20%" />
            <line x1="0%" x2="100%" y1="30%" y2="30%" />
            <line x1="0%" x2="100%" y1="40%" y2="40%" />
            <line x1="0%" x2="100%" y1="50%" y2="50%" />
            <line x1="0%" x2="100%" y1="60%" y2="60%" />
            <line x1="0%" x2="100%" y1="70%" y2="70%" />
            <line x1="0%" x2="100%" y1="80%" y2="80%" />
            <line x1="0%" x2="100%" y1="90%" y2="90%" />
            <line x1="0%" x2="100%" y1="100%" y2="100%" />
          </g>
          <g {...lineProps}>
            <line x1="0%" x2="0%" y1="0%" y2="100%" />
            <line x1="20%" x2="20%" y1="0%" y2="100%" />
            <line x1="40%" x2="40%" y1="0%" y2="100%" />
            <line x1="60%" x2="60%" y1="0%" y2="100%" />
            <line x1="80%" x2="80%" y1="0%" y2="100%" />
            <line x1="100%" x2="100%" y1="0%" y2="100%" />
          </g>
          <g {...lineProps} strokeWidth={2}>
            <line x1="0%" x2="100%" y1="0%" y2="0%" />
            <line x1="0%" x2="100%" y1="100%" y2="100%" />
            <line x1="0%" x2="0%" y1="0%" y2="100%" />
            <line x1="100%" x2="100%" y1="0%" y2="100%" />
          </g>
        </svg>
        <div className="bg-gradient-radial from-background to-transparent p-16 text-center">
          <h2 className="text-2xl font-medium">No price history</h2>
          <p className="text-muted-foreground">
            Hang tight, we&apos;ll fetch the prices for you soon.
          </p>
        </div>
      </div>
    );
  }

  const prices = [...consumerPrices, { ...lastPrice, timestamp: new Date().toISOString() }].map(
    (price) => ({
      date: price.timestamp.toString(),
      price: price.priceInCents,
      stock: price.inStock ? 1 : 0,
    }),
  );

  return (
    <ParentSize className="relative">
      {({ width, height }) => <ChartComponent prices={prices} width={width} height={height} />}
    </ParentSize>
  );
}

function ChartComponent({ prices, width, height, margin = defaultMargin }: ChartComponentProps) {
  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
    useTooltip<ChartUnit>();

  // bounds
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  if (innerWidth === 0 || innerHeight === 0) return null;

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
    <Fragment>
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          <LinearGradient id="area-gradient" from="#edffea" to="#edffea" toOpacity={0.1} />
          <AreaClosed<ChartUnit>
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
            tickLabelProps={{ className: "font-sans text-xs" }}
            tickFormat={(value) => formatCurrency(value.valueOf())}
            hideTicks
            hideAxisLine
          />
          <AxisBottom
            top={innerHeight}
            scale={timeScale}
            tickLabelProps={{ className: "font-sans text-xs" }}
            numTicks={Math.min(10, innerWidth / 80)}
            hideTicks
            hideAxisLine
          />
          <GridRows scale={priceScale} width={innerWidth} height={innerHeight} stroke="#e0e0e0" />
          <GridColumns scale={timeScale} width={innerWidth} height={innerHeight} stroke="#e0e0e0" />
          <LinePath<ChartUnit>
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
    </Fragment>
  );
}
