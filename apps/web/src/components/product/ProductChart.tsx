"use client";

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

import { useProductInfo } from "@/components/product/ProductInfoProvider";
import { formatCurrency, formatDate } from "@/utils/utils";

export type ChartPrice = {
  date: string;
  price: number;
  stock: number;
};

export type PricesChartProps = {
  prices: ChartPrice[] | null;
  margin?: { top: number; right: number; bottom: number; left: number };
  showAxes?: boolean;
};

type VisxChartProps = {
  prices: ChartPrice[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  showAxes: boolean;
};

// accessors
const dateBisector = bisector<ChartPrice, Date>((d) => new Date(d.date)).left;
const dateAccessor = (d: ChartPrice) => new Date(d.date);
const priceAccessor = (d: ChartPrice) => d.price;
const stockAccessor = (d: ChartPrice) => d.stock;

const defaultMargin = { top: 10, right: 0, bottom: 35, left: 60 };

export function ProductChart({
  prices,
  margin = defaultMargin,
  showAxes = true,
}: PricesChartProps) {
  const { isLoading } = useProductInfo();

  return (
    <ParentSize className="relative">
      {({ width, height }) => {
        const chartComponent =
          prices === null ? (
            <PlaceholderChart />
          ) : (
            <VisxChart
              prices={prices}
              width={width}
              height={height}
              margin={margin}
              showAxes={showAxes}
            />
          );

        const overlayComponent = isLoading ? (
          <div className="bg-gradient-radial from-background absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 to-transparent p-16 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : prices === null ? (
          <div className="bg-gradient-radial from-background absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 to-transparent p-16 text-center">
            <h2 className="text-xl font-medium">No price history</h2>
            <p className="text-muted-foreground">
              We have no data in this date range. Maybe try again later?
            </p>
          </div>
        ) : null;

        return (
          <div className="relative h-[20rem] sm:h-[24rem] md:h-[28rem]">
            {chartComponent}
            {overlayComponent}
          </div>
        );
      }}
    </ParentSize>
  );
}

function PlaceholderChart() {
  return (
    <svg
      className="h-full w-full overflow-visible"
      stroke="#e0e0e0"
      strokeWidth={1}
      shapeRendering="crispEdges"
    >
      <g>
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
      <g>
        <line x1="0%" x2="0%" y1="0%" y2="100%" />
        <line x1="20%" x2="20%" y1="0%" y2="100%" />
        <line x1="40%" x2="40%" y1="0%" y2="100%" />
        <line x1="60%" x2="60%" y1="0%" y2="100%" />
        <line x1="80%" x2="80%" y1="0%" y2="100%" />
        <line x1="100%" x2="100%" y1="0%" y2="100%" />
      </g>
      <g strokeWidth={2}>
        <line x1="0%" x2="100%" y1="0%" y2="0%" />
        <line x1="0%" x2="100%" y1="100%" y2="100%" />
        <line x1="0%" x2="0%" y1="0%" y2="100%" />
        <line x1="100%" x2="100%" y1="0%" y2="100%" />
      </g>
    </svg>
  );
}

function VisxChart({ prices, width, height, margin, showAxes }: VisxChartProps) {
  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
    useTooltip<ChartPrice>();

  if (width <= 0 || height <= 0) return null;

  // bounds
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

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
          <LinearGradient
            id="area-gradient"
            from="#A8FF99"
            fromOpacity={0.3}
            to="#A8FF99"
            toOpacity={0.03}
          />
          <AreaClosed<ChartPrice>
            data={prices}
            x={(d) => timeScale(dateAccessor(d))}
            y={(d) => stockScale(stockAccessor(d))}
            yScale={stockScale}
            curve={curveStepAfter}
            strokeWidth={1}
            stroke="#398739"
            fill="url(#area-gradient)"
          />
          {showAxes ? (
            <Fragment>
              <AxisLeft
                scale={priceScale}
                tickLabelProps={{
                  className: "font-sans text-xs tabular-nums",
                  fill: "hsl(var(--foreground))",
                }}
                tickFormat={(value) => formatCurrency(value.valueOf())}
                hideTicks
                hideAxisLine
              />
              <AxisBottom
                top={innerHeight}
                scale={timeScale}
                tickLabelProps={{
                  className: "font-sans text-xs tabular-nums",
                  fill: "hsl(var(--foreground))",
                }}
                numTicks={Math.min(10, innerWidth / 80)}
                hideTicks
                hideAxisLine
              />
            </Fragment>
          ) : null}
          <GridRows scale={priceScale} width={innerWidth} height={innerHeight} stroke="#e0e0e0" />
          <GridColumns scale={timeScale} width={innerWidth} height={innerHeight} stroke="#e0e0e0" />
          <LinePath<ChartPrice>
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
          className="border-border bg-background absolute space-y-1 rounded-md border p-3 shadow-lg"
          style={{}}
          key={Math.random()}
          top={tooltipTop}
          left={tooltipLeft}
        >
          <p className="text-sm">
            Price:{" "}
            <span className="tabular-nums">{formatCurrency(priceAccessor(tooltipData))}</span>
            {!stockAccessor(tooltipData) ? "*" : undefined}
          </p>
          <p className="text-[12px] tabular-nums">
            {formatDate(new Date(dateAccessor(tooltipData)))}
          </p>
        </TooltipWithBounds>
      )}
    </Fragment>
  );
}
