type GranularityType = "MONTHLY" | "DAILY";
const GranularityValues: GranularityType[] = ["MONTHLY", "DAILY"];

type FilterType = {
  granularity: GranularityType;
  recordTypes: string[];
};

type Group = {
  Keys: string[];
  Metrics: {
    BlendedCost: {
      Amount: string;
    };
  };
};

type ResultByTime = {
  TimePeriod: { Start: string };
  Groups: Group[];
};

export type { GranularityType, FilterType, Group, ResultByTime };
export { GranularityValues };
