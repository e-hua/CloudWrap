import { assumeRole } from "@/services/assumeRoleService";
import { getCostAndUsage } from "@/services/billService/costService";
import { getErrorMessage } from "@/utils/errors";
import { FileCache } from "@/utils/FileCache";
import { Granularity, type ResultByTime } from "@aws-sdk/client-cost-explorer";
import { app, ipcMain } from "electron";

function isString(val: unknown): val is string {
  return typeof val === "string";
}

function isValidGranularity(val: string): val is Granularity {
  const validGranularities: string[] = Object.values(Granularity);
  return validGranularities.includes(val);
}

const userDataPath = app.getPath('userData');
const costCache = new FileCache<ResultByTime[]>(
  userDataPath, 
  "cost",
  2 * 24 * 60 * 60 * 1000
);

function setupBillHandler() {
  ipcMain.handle('bill:get-cost', async (_, { granularity, recordTypes }) => {
    try {
      await costCache.init();
      const credential = await assumeRole();

      let finalGranularity: Granularity = Granularity.MONTHLY;

      if (isString(granularity) && isValidGranularity(granularity)) {
        finalGranularity = granularity;
      } else if (!granularity) {
        throw new Error(
          `Parameter 'granularity' (${granularity}) is invalid. Must be one of: ${Object.values(
            Granularity
          ).join(", ")}`
        );
      }

      if (!isString(recordTypes)) {
        throw new Error("granularity is not a proper string");
      }

      const filterOptions = {
        recordTypes: recordTypes.split(",") || ["Usage"],
      };

      // Cache key based on query alone
      const key = `cost_${granularity}_${filterOptions.recordTypes.join("_")}`;

      let costs: ResultByTime[] | undefined = await costCache.get(key);
      if (!costs) {
        console.log("Cache miss")
        costs = await getCostAndUsage(
          credential,
          finalGranularity,
          filterOptions
        );
        await costCache.put(key, costs);
      } else {
        console.log("Cache hit")
      }

      return { success: true, data: costs }
    } catch (err) {
      return { success: false, error: getErrorMessage(err) }
    }
  })
}

export default setupBillHandler;