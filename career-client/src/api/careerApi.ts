import axios from "axios";
import type { JobApplicationPayload } from "../types/career";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export async function getPublicJobs() {
  const response = await api.get(
    "/public/careers/jobs"
  );

  return response.data?.data || [];
}

export async function getPublicJob(
  slug: string
) {
  const response = await api.get(
    `/public/careers/jobs/${encodeURIComponent(slug)}`
  );

  return response.data?.data;
}

export async function applyForJob(
  slug: string,
  payload: JobApplicationPayload
) {
  console.log(
    "Submitting career application:",
    payload
  );

  const response = await api.post(
    `/public/careers/jobs/${encodeURIComponent(slug)}/apply`,
    payload
  );

  return response.data?.data;
}

export default api;