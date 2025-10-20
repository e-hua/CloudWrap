import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import clsx from "clsx";

import type {
  LineChartCardProps,
  TooltipPayloadType,
} from "@/components/ui/Charts/charts.type";

import {
  pruneZeroCosts,
  computeDataWithTotal,
} from "@/components/ui/Charts/charts.type";

function CustomToolTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadType[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const payloadSorted = [...payload].sort((a, b) => {
    const aValue = a.value ?? "0";
    const bValue = b.value ?? "0";

    const aNumeric = parseFloat(String(aValue));
    const bNumeric = parseFloat(String(bValue));

    return bNumeric - aNumeric;
  });

  const total = payloadSorted.find((elem) => elem.name === "Total");

  return (
    <div
      className="bg-sidebar-background border-[1px] border-card-border 
    rounded-lg text-sm
    p-4"
    >
      <h1 className="text-text-secondary font-medium text-md">{label}</h1>
      {total && (
        <div className="flex flex-row justify-between">
          <span style={{ color: total.color }}>{total.name}</span>
          <span className="text-text-secondary">
            ${parseFloat(total.value)?.toFixed(2)}
          </span>
        </div>
      )}

      <hr className="my-2 text-sidebar-border" />

      {payloadSorted.slice(1).map((entry, idx) => (
        <div
          key={idx}
          className="flex flex-row justify-between items-center text-xs py-0.5"
        >
          <span style={{ color: entry.color }} className="flex-6 text">
            {entry.name}
          </span>
          <span className="text-text-secondary flex-1">
            ${parseFloat(entry.value)?.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function LineChartCard({
  data = [],
  lines = [],
}: LineChartCardProps) {
  const dataWithTotal = useMemo(
    () => computeDataWithTotal(data, lines),
    [data, lines]
  );

  // An object with dataKey: string => color: string mapping
  const [selectedLines, setSelectedLines] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    const linesWithNoneZeroCosts = pruneZeroCosts(dataWithTotal, lines);
    const parsedLinesObject = linesWithNoneZeroCosts.reduce(
      (prev, currLine) => {
        prev[currLine.dataKey] = currLine.color;
        return prev;
      },
      {} as Record<string, string>
    );

    setSelectedLines(parsedLinesObject);
  }, [dataWithTotal, lines]);

  return (
    <div
      className="w-full h-full 
      bg-card border-[1px] border-card-border 
      p-4 rounded-2xl rechart-wrapper
      flex flex-col"
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            width={500}
            height={300}
            data={dataWithTotal}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 10,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--card-border)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke="var(--border-default)"
              tick={{ fill: "var(--muted-foreground)", fontSize: 14 }}
            />
            <YAxis
              stroke="var(--border-default)"
              tick={{ fill: "var(--muted-foreground)", fontSize: 14 }}
            />
            <Tooltip
              cursor={{
                stroke: "var(--menu-item-active)",
                strokeWidth: 1.5,
                opacity: 0.8,
              }}
              content={<CustomToolTip />}
            />
            {Object.entries(selectedLines).map((elem, idx) => {
              return (
                <Line
                  dataKey={elem[0]}
                  stroke={elem[1]}
                  type="monotone"
                  key={idx}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="max-h-48 overflow-auto grid grid-cols-2 md:grid-cols-3">
        {lines.map((line, idx) => {
          return (
            <div
              key={idx}
              className={`hover:bg-sidebar-hovered rounded-md
                items-center text-center 
                flex flex-row justify-start 
                border-transparent
                border-[1px] hover:border-sidebar-border`}
              onClick={() => {
                if (selectedLines[line.dataKey]) {
                  const keyToRemove = line.dataKey;
                  const { [keyToRemove]: _, ...rest } = selectedLines;
                  setSelectedLines(rest);
                } else {
                  setSelectedLines({
                    ...selectedLines,
                    [line.dataKey]: line.color,
                  });
                }
              }}
            >
              <div className="flex-1 flex items-center justify-center">
                <button
                  className={clsx(
                    selectedLines[line.dataKey] && line.className,
                    "w-2 h-2 border-[1px] border-sidebar-border"
                  )}
                />
              </div>
              <div className="flex-7">
                <span
                  className={clsx("text-[10px] text-text-secondary text-wrap")}
                >
                  {line.dataKey}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
