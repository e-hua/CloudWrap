type ChartLine = {
  dataKey: string; // e.g., "EC2", "S3", etc. (name of the datum)
  color: string; // Color of the line
  className: string; // For the legend styling
  textColor: string; // For the coloring of text
};

type RawChartDatum = {
  name: string;
  [key: string]: string;
};

type ProcessedChartDatum = {
  Total: string;
} & RawChartDatum;

type LineChartCardProps = {
  data: RawChartDatum[];
  lines: ChartLine[];
};

// returning lines first shown
function pruneZeroCosts(
  data: RawChartDatum[] = [],
  lines: ChartLine[] = []
): ChartLine[] {
  return lines.filter((line) => {
    return data.some((datum) => {
      const costValue = datum[line.dataKey];
      const numericCost = parseFloat(costValue);
      return costValue && !isNaN(numericCost) && numericCost > 0;
    });
  });
}

// returning processed data
function computeDataWithTotal(
  data: RawChartDatum[] = [],
  lines: ChartLine[] = []
): ProcessedChartDatum[] {
  return data.map((datum) => {
    const total: number = lines
      .map((line) => datum[line.dataKey] ?? 0)
      .reduce((prev, curr) => {
        return prev + parseFloat(curr);
      }, 0);
    return { ...datum, Total: total.toFixed(2) };
  });
}

type TooltipPayloadType = {
  name: string;
  value: string;
  color?: string;
};

export { pruneZeroCosts, computeDataWithTotal };

export type {
  ChartLine,
  RawChartDatum,
  ProcessedChartDatum,
  LineChartCardProps,
  TooltipPayloadType,
};
