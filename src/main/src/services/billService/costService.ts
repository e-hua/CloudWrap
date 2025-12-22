import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  Granularity,
  type Expression,
  type ResultByTime,
} from "@aws-sdk/client-cost-explorer";
import type { StrictCredentials } from "@/services/assumeRoleService.js";
import { STRICT_AWS_REGION as region } from "@/config/aws.config.js";

type FilterOptions = {
  recordTypes: string[];
};

function createCostExplorerClient(credential: StrictCredentials) {
  return new CostExplorerClient({
    region: region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken,
    },
  });
}

function getTimePeriod(granularity: Granularity) {
  // "DAILY" || "MONTHLY" || "HOURLY"
  let currDate = new Date();
  let startDate = new Date(currDate);

  switch (granularity) {
    case "DAILY":
      // set the start date to be one month ago
      startDate.setMonth(currDate.getMonth() - 1);
      break;

    case "MONTHLY":
      // set the start date to be one year ago
      startDate.setFullYear(currDate.getFullYear() - 1);
      break;

    default:
      throw new Error("Invalid granularity");
  }

  return {
    Start: startDate.toISOString().substring(0, 10),
    End: currDate.toISOString().substring(0, 10),
  };
}

function buildFilter(filterOptions: FilterOptions): Expression | undefined {
  const filters: Expression[] = [];

  // RECORD_TYPE ["Usage", "Credit", "Refund"...]
  if (filterOptions.recordTypes.length > 0) {
    filters.push({
      Dimensions: {
        Key: "RECORD_TYPE",
        Values: filterOptions.recordTypes,
      },
    });
  }

  if (filters.length === 0) return undefined;
  if (filters.length === 1) return filters[0];
  return { And: filters };
}

async function getCostAndUsage(
  credential: StrictCredentials,
  granularity: Granularity,
  filterOptions: FilterOptions
): Promise<ResultByTime[]> {
  const client = createCostExplorerClient(credential);

  const command = new GetCostAndUsageCommand({
    TimePeriod: getTimePeriod(granularity),
    Granularity: granularity,
    Metrics: ["BlendedCost"],
    GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
    Filter: buildFilter(filterOptions),
  });

  const response = await client.send(command);
  const resultsByTime = response.ResultsByTime;
  if (!resultsByTime) {
    throw new Error("No results from AWS");
  }
  return resultsByTime;
}

export { getCostAndUsage };
