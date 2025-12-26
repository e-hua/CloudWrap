import { BACKEND_ENDPOINT_URL } from "@/config/constants";
import type {
  CreateServicePayload,
  DeleteServicePayload,
  UpdateServicePayload,
} from "./service.schema";

const serviceURL = `${BACKEND_ENDPOINT_URL}services/`;

async function fetchServices() {
  try {
    const response = await window.api.services.list({})
    if (response.success) {
      const result = response.data || []
      return result;
    } else {
      throw new Error(`Main thread error: ${response.error}`)
    }
  } catch (error) {
    console.error(error);
    return undefined
  }
}

async function fetchService(id: number) {
  try {
    const response = await window.api.services.get(id)
    if (response.success) {
      const result = response.data
      return result;
    } else {
      throw new Error(`Main thread error: ${response.error}`)
    }
  } catch (error) {
    console.error(error);
    return undefined
  }
}

async function createService(payload: CreateServicePayload | undefined) {
  if (!payload) {
    return;
  }

  try {
    const response = await window.api.services.create(payload)
    return response;
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
    const response = await window.api.services.update(id, payload)
    return response;
  } catch (err) {
    console.error(err);
  }
}

async function deleteService(
  payload: DeleteServicePayload | undefined,
  id: string
) {
  if (!payload) {
    return;
  }

  try {
    const response = await window.api.services.delete(id, payload)
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
