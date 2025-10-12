import {
  CostExplorerClient,
  GetCostAndUsageCommand,
} from "@aws-sdk/client-cost-explorer";

const region = process.env.AWS_REGION;

function createCostExplorerClient(credential) {
  return new CostExplorerClient({
    region: region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken,
    },
  });
}

function getTimePeriod(granularity) {
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

function buildFilter(filterOptions = {}) {
  const filters = [];

  // RECORD_TYPE ["Usage", "Credit", "Refund"...]
  if (filterOptions.recordTypes && filterOptions.recordTypes.length > 0) {
    filters.push({
      Dimensions: {
        Key: "RECORD_TYPE",
        Values: filterOptions.recordTypes,
      },
    });
  }

  // SERVICE [
  // "Amazon Elastic Compute Cloud - Compute",
  // "Amazon Simple Storage Service"
  // ]
  if (filterOptions.services && filterOptions.services.length > 0) {
    filters.push({
      Dimensions: {
        Key: "SERVICE",
        Values: filterOptions.services,
      },
    });
  }

  if (filters.length === 0) return undefined;
  if (filters.length === 1) return filters[0];
  return { And: filters };
}

async function getCostAndUsage(credential, granularity, filterOptions = {}) {
  const client = createCostExplorerClient(credential);

  const command = new GetCostAndUsageCommand({
    TimePeriod: getTimePeriod(granularity),
    Granularity: granularity,
    Metrics: ["BlendedCost"],
    GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
    Filter: buildFilter(filterOptions),
  });

  const response = await client.send(command);
  return response.ResultsByTime;
}

export { getCostAndUsage };
