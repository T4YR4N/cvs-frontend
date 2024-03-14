import { get } from "http";
import { ApiResponse } from "./apiModel";
import { getBackendUrl } from "../env/readers";

const apiFetch = async <T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const baseUrl = getBackendUrl();

  const response = await fetch(`${baseUrl}${url}`, options);
  const data = await response.json();
  return data as ApiResponse<T>;
};

export default apiFetch;
