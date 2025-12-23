import type { FilterType } from "./bills.types";

async function fetchCost(filterOptions: FilterType) {
  try {
    const response = await window.api.bill.getCost({granularity: filterOptions.granularity, recordTypes: filterOptions.recordTypes.join(",")})
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error)
    }
  } catch (error) {
    console.error(error);
    return undefined
  }
}

export { fetchCost };
export type { FilterType };
