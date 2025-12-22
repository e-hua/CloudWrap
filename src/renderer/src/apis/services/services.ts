import { BACKEND_ENDPOINT_URL } from "@/config/constants";
import type { DBServerType, DBServiceType, DBSiteType } from "./services.types";
import type {
  CreateServicePayload,
  DeleteServicePayload,
  UpdateServicePayload,
} from "./service.schema";

const serviceURL = `${BACKEND_ENDPOINT_URL}services/`;

async function fetchServices() {
  try {
    const response = await fetch(serviceURL, {
      method: "GET",
    });

    const result: DBServiceType[] = await response.json();

    return result;
  } catch (err) {
    console.error(err);
  }
}

async function createService(payload: CreateServicePayload | undefined) {
  if (!payload) {
    return;
  }

  try {
    const response = await fetch(serviceURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return response;
  } catch (err) {
    console.error(err);
  }
}

async function fetchService(id: number) {
  try {
    const response = await fetch(`${serviceURL}${id}`, {
      method: "GET",
    });

    const result = await response.json();

    if (result.err) {
      return undefined;
    } else {
      return result as DBServerType | DBSiteType;
    }
  } catch (err) {
    console.error(err);
  }
}

async function updateService(
  payload: UpdateServicePayload | undefined,
  id: string
) {
  if (!payload) {
    return;
  }

  try {
    const response = await fetch(`${serviceURL}${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return response;
  } catch (err) {
    console.error(err);
  }
}

async function deleteService(
  payload: DeleteServicePayload | undefined,
  id: string
) {
  try {
    const response = await fetch(`${serviceURL}${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return response;
  } catch (err) {
    console.error(err);
  }
}

export {
  fetchServices,
  createService,
  fetchService,
  updateService,
  deleteService,
};

export { serviceURL };
