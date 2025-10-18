import { BACKEND_ENDPOINT_URL } from "../config/constants";

const billsURL = `${BACKEND_ENDPOINT_URL}bill/`;

async function fetchCost(filterOptions = {}, ARN = "") {
  try {
    const params = new URLSearchParams();

    if (filterOptions?.granularity) {
      params.append("granularity", filterOptions.granularity);
    }

    if (filterOptions?.recordTypes?.length) {
      params.append("recordTypes", filterOptions.recordTypes.join(","));
    }

    if (filterOptions?.services?.length) {
      params.append("services", filterOptions.services.join(","));
    }

    const response = await fetch(`${billsURL}cost?${params.toString()}`, {
      method: "GET",
      headers: {
        ARN,
      },
    });

    const result = response.json();
    return result;
  } catch (error) {
    console.error(error);
  }
}

export { fetchCost };
