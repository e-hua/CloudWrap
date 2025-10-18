import { useEffect, useState } from "react";
import { fetchCost } from "../apis/bills";
import LineChartCard from "../components/ui/Charts/LineChartCard";
import StackedBarChartCard from "../components/ui/Charts/StackedBarChartCard";
import ToggleGroup from "../components/ui/ToggleGroup";

const linesColors = [
  {
    dataKey: "AWS Cost Explorer",
    color: "var(--chart-red)",
    className: "bg-chart-red",
    textColor: "text-chart-red",
  },
  {
    dataKey: "AWS Glue",
    color: "var(--chart-pink)",
    className: "bg-chart-pink",
    textColor: "text-chart-pink",
  },
  {
    dataKey: "AWS Secrets Manager",
    color: "var(--chart-orange)",
    className: "bg-chart-orange",
    textColor: "text-chart-orange",
  },
  {
    dataKey: "Amazon CloudFront",
    color: "var(--chart-yellow)",
    className: "bg-chart-yellow",
    textColor: "text-chart-yellow",
  },
  {
    dataKey: "EC2 - Other",
    color: "var(--chart-lime)",
    className: "bg-chart-lime",
    textColor: "text-chart-lime",
  },
  {
    dataKey: "Amazon Elastic Compute Cloud - Compute",
    color: "var(--chart-green)",
    className: "bg-chart-green",
    textColor: "text-chart-green",
  },
  {
    dataKey: "Amazon Location Service",
    color: "var(--chart-cyan)",
    className: "bg-chart-cyan",
    textColor: "text-chart-cyan",
  },
  {
    dataKey: "Amazon Simple Notification Service",
    color: "var(--chart-blue)",
    className: "bg-chart-blue",
    textColor: "text-chart-blue",
  },
  {
    dataKey: "Amazon Simple Queue Service",
    color: "var(--chart-purple)",
    className: "bg-chart-purple",
    textColor: "text-chart-purple",
  },
  {
    dataKey: "Amazon Simple Storage Service",
    color: "var(--chart-brown)",
    className: "bg-chart-brown",
    textColor: "text-chart-brown",
  },
  {
    dataKey: "Amazon Virtual Private Cloud",
    color: "var(--chart-gray)",
    className: "bg-chart-gray",
    textColor: "text-chart-gray",
  },
  {
    dataKey: "AmazonCloudWatch",
    color: "var(--chart-teal)",
    className: "bg-chart-teal",
    textColor: "text-chart-teal",
  },
  {
    dataKey: "Total",
    color: "var(--chart-olive)",
    className: "bg-chart-olive",
    textColor: "text-chart-olive",
  },
];

function parseGroups(groups) {
  return Object.fromEntries(
    groups.map((group) => {
      return [
        group.Keys[0],
        parseFloat(group.Metrics.BlendedCost.Amount).toFixed(2),
      ];
    })
  );
}

function parseFetchCostResult(res) {
  return res.map((elem) => {
    return {
      /*
      Start: elem.TimePeriod.Start, 
      End: elem.TimePeriod.End,
       */
      name: elem.TimePeriod.Start,
      ...parseGroups(elem.Groups),
    };
  });
}

export default function CostDashboardPage() {
  const [filters, setFilters] = useState({
    granularity: "MONTHLY",
    recordTypes: ["Usage"],
    services: [],
  });

  const [data, setData] = useState([]);
  useEffect(() => {
    (async () => {
      const res = await fetchCost(filters);
      setData(parseFetchCostResult(res));
    })();
  }, [filters]);

  const updateGranularity = (newGranularity) => {
    const newFilters = { ...filters, granularity: newGranularity };
    setFilters(newFilters);
  };

  const updateRecordTypes = (newRecordTypes) => {
    const newFilters = { ...filters, recordTypes: JSON.parse(newRecordTypes) };
    setFilters(newFilters);
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full p-5">
      <div className="flex flex-col w-full justify-between gap-4">
        <h1 className="text-text-primary text-xl">Cost and Usage Dashboard</h1>
        <div className="mt-2 text-text-secondary space-y-2">
          <p className="text-sm">
            This dashboard tracks the costs of all AWS services for your
            account.
          </p>
          <p className="text-xs">
            Negligible costs that round to 0.00 are omitted by default. You can
            turn them back on to get a more complete picture of service usage.
          </p>
          <p className="text-xs">
            Note: Accessing certain features may trigger AWS charges, but we are
            using caching to minimize API calls
          </p>
        </div>
      </div>

      <div className="flex flex-row w-full justify-between gap-2">
        {/* All the toggle groups */}
        <ToggleGroup
          options={[
            {
              value: "MONTHLY",
              text: "Last 12 Months",
            },
            {
              value: "DAILY",
              text: "Last 30 Days",
            },
          ]}
          value={filters.granularity}
          onValueChange={updateGranularity}
        />
        <ToggleGroup
          options={[
            {
              value: JSON.stringify(["Usage"]),
              text: "Usage",
            },
            {
              value: JSON.stringify(["Usage", "Credit"]),
              text: "Cost After Cancelling With Credits",
            },
          ]}
          value={JSON.stringify(filters.recordTypes)}
          onValueChange={updateRecordTypes}
        />
      </div>

      <div className="flex flex-col md:flex-row">
        <div className="p-4">
          <LineChartCard data={data} lines={linesColors} />
        </div>
        <div className="p-4">
          <StackedBarChartCard data={data} lines={linesColors} />
        </div>
      </div>
    </div>
  );
}
