"use client";

import { Fragment } from "react";
import { AxisBottom } from "@visx/axis";
import { curveStepAfter } from "@visx/curve";
import { localPoint } from "@visx/event";
import { RadialGradient } from "@visx/gradient";
import { Group } from "@visx/group";
import { Pattern } from "@visx/pattern";
import { ParentSize } from "@visx/responsive";
import { scaleLinear, scaleTime } from "@visx/scale";
import { Bar, Circle, LinePath } from "@visx/shape";
import { TooltipWithBounds, useTooltip } from "@visx/tooltip";
import { bisector, extent } from "d3-array";

import { useProductInfo } from "@/components/product/ProductInfoProvider";
import { formatCurrency, formatDate } from "@/utils/utils";

export type PricesChartProps = {
  augmentCurrentPrice?: boolean;
};

export function ProductChart({ augmentCurrentPrice = true }: PricesChartProps) {
  const { isPending, variantListings } = useProductInfo();

  const cleanedListings: ChartListing[] = variantListings.map((listing) => {
    const { prices } = listing;

    const lastPrice = prices?.at(-1);
    const chartPrices: ChartPrice[] = prices
      .concat(augmentCurrentPrice && lastPrice ? { ...lastPrice, timestamp: new Date() } : [])
      .map((price) => ({
        date: price.timestamp,
        price: price.priceInCents,
        stock: price.inStock ? 1 : 0,
      }));

    return {
      id: listing.id.toString(),
      storeName: listing.storeListing.store.name,
      prices: chartPrices,
    };
  });

  const overlayComponent = isPending ? (
    <div className="bg-gradient-radial from-background absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 to-transparent p-16 text-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  ) : variantListings.length === 0 ? (
    <div className="bg-gradient-radial from-background absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 to-transparent p-16 text-center">
      <h2 className="text-xl font-medium">No price history</h2>
      <p className="text-muted-foreground">
        We have no data in this date range. Maybe try again later?
      </p>
    </div>
  ) : null;

  return (
    <ParentSize className="relative">
      {({ width, height }) => (
        <Fragment>
          <VisxChart listings={cleanedListings} width={width} height={height} />
          {overlayComponent}
        </Fragment>
      )}
    </ParentSize>
  );
}

export type ChartListing = {
  id: string;
  storeName: string;
  prices: ChartPrice[];
};

export type ChartPrice = {
  date: Date;
  price: number;
  stock: number;
};

export type TooltipData = {
  listings: {
    storeName: string;
    price: ChartPrice | null;
  }[];
  date: Date;
};

// accessors
const dateBisector = bisector<ChartPrice, Date>((d) => new Date(d.date)).left;
const dateAccessor = (d: ChartPrice) => new Date(d.date);
const priceAccessor = (d: ChartPrice) => d.price;

type VisxChartProps = {
  listings: ChartListing[];
  width: number;
  height: number;
};

function VisxChart({ listings, width, height }: VisxChartProps) {
  const { tooltipData, tooltipLeft, tooltipOpen, showTooltip, hideTooltip } =
    useTooltip<TooltipData>();

  if (width <= 0 || height <= 0) {
    return null;
  }

  const prices = listings.flatMap((listing) => listing.prices);

  const margin = { top: 0, right: 0, bottom: prices.length > 0 ? 36 : 0, left: 0 };

  // bounds
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // scales
  const timeExtent = extent(prices, dateAccessor);
  const timeScale = scaleTime<number>({
    range: [0, innerWidth],
    domain: timeExtent as [Date, Date],
    round: true,
  });
  const priceExtent = extent(prices, priceAccessor);
  const priceScale = scaleLinear<number>({
    range: [innerHeight, 0],
    domain: [0, (priceExtent[1] ?? 0) * 1.2],
  });

  const handleTooltip = (event: React.TouchEvent<SVGElement> | React.MouseEvent<SVGElement>) => {
    const coords = localPoint(event) ?? { x: 0, y: 0 };
    const invertedDate = timeScale.invert(coords.x - margin.left);
    const index = dateBisector(prices, invertedDate, 1);

    const tooltipListings = listings.map((listing) => ({
      price: listing.prices[index - 1] ?? null,
      storeName: listing.storeName,
    }));

    showTooltip({
      tooltipLeft: coords.x,
      tooltipTop: coords.y,
      tooltipData: {
        listings: tooltipListings,
        date: invertedDate,
      },
    });
  };

  return (
    <Fragment>
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          <RadialGradient id="grid-gradient" from="#DBDBDB" to="#4A4A4A" />
          <linearGradient id="tooltip-gradient" gradientTransform="rotate(90)">
            <stop offset="0" stopColor="black" />
            <stop offset="0.25" stopColor="white" />
            <stop offset="0.75" stopColor="white" />
            <stop offset="1" stopColor="black" />
          </linearGradient>
          <mask id="grid-mask">
            <Bar width={innerWidth} height={innerHeight} fill="url(#grid-gradient)" />
          </mask>
          <mask id="tooltip-mask">
            <Bar
              x={margin.left}
              y={margin.top}
              width={innerWidth}
              height={innerHeight}
              fill="url(#tooltip-gradient)"
            />
          </mask>
          <mask id="chart-mask">
            <Bar width={innerWidth} height={innerHeight} fill="white" />
          </mask>
          <Pattern id="grid-pattern" width={12} height={12}>
            <Circle cx={5} cy={5} r={1.5} fill="hsl(var(--border))" />
          </Pattern>
          <Bar
            width={innerWidth}
            height={innerHeight}
            fill="url(#grid-pattern)"
            mask="url(#grid-mask)"
          />
          <AxisBottom
            top={innerHeight + 8}
            scale={timeScale}
            tickComponent={({ formattedValue, x, y, dy }) => (
              <text
                className="text-xs"
                x={x}
                y={y}
                dy={dy}
                fill="hsl(var(--muted-foreground))"
                textAnchor="middle"
              >
                {formattedValue}
              </text>
            )}
            numTicks={Math.min(4, innerWidth / 80)}
            hideTicks
            hideAxisLine
          />
          {listings.map((listing) => (
            <LinePath<ChartPrice>
              key={listing.id}
              data={listing.prices}
              x={(d) => timeScale(dateAccessor(d))}
              y={(d) => priceScale(priceAccessor(d))}
              curve={curveStepAfter}
              strokeWidth={2}
              stroke="#2b8bad"
            />
          ))}
          <Bar
            width={innerWidth}
            height={innerHeight}
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={() => hideTooltip()}
            onTouchEnd={() => hideTooltip()}
            stroke="hsl(var(--border))"
            strokeWidth={2}
            fill="transparent"
            mask="url(#chart-mask)"
          />
        </Group>
        {tooltipData && (
          <Bar
            width={2}
            height={innerHeight}
            x={tooltipLeft}
            pointerEvents="none"
            fill="hsl(var(--muted-foreground))"
            mask="url(#tooltip-mask)"
          />
        )}
      </svg>
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          className="bg-background absolute flex flex-col justify-center gap-1.5 rounded-md border p-2 text-sm shadow-sm"
          unstyled={true}
          left={tooltipLeft}
          offsetLeft={8}
          offsetTop={8}
        >
          {tooltipData.listings.map((listing) => (
            <p key={listing.storeName} className="font-medium tabular-nums">
              {`${listing.storeName}: ${
                listing.price ? formatCurrency(listing.price.price) : "N/A"
              }${!listing.price?.stock ? "*" : ""}`}
            </p>
          ))}
          <span className="text-muted-foreground tabular-nums">{formatDate(tooltipData.date)}</span>
        </TooltipWithBounds>
      )}
    </Fragment>
  );
}
