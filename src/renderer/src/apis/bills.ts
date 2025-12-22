import { BACKEND_ENDPOINT_URL } from "@/config/constants";
import type { FilterType } from "./bills.types";

const billsURL = `${BACKEND_ENDPOINT_URL}bill/`;

async function fetchCost(filterOptions: FilterType) {
  try {
    const params = new URLSearchParams();

    if (filterOptions?.granularity) {
      params.append("granularity", filterOptions.granularity);
    }

    if (filterOptions?.recordTypes?.length) {
      params.append("recordTypes", filterOptions.recordTypes.join(","));
    }

    const response = await fetch(`${billsURL}cost?${params.toString()}`, {
      method: "GET",
    });

    const result = response.json();
    return result;
  } catch (error) {
    console.error(error);
  }
}

export { fetchCost };
export type { FilterType };
