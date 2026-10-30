import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4100",
  timeout: 15000,
});
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = sessionStorage.getItem("haven-token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
api.interceptors.response.use(
  (response) => {
    if (
      typeof window !== "undefined" &&
      !["get", "head", "options"].includes(response.config.method ?? "get")
    )
      window.dispatchEvent(
        new CustomEvent("haven-data-changed", { detail: response.config.url }),
      );
    return response;
  },
  (error) => {
    if (
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      !error.config?.url?.startsWith("/auth/") &&
      sessionStorage.getItem("haven-token")
    ) {
      sessionStorage.removeItem("haven-token");
      window.dispatchEvent(new Event("haven-session-expired"));
    }
    return Promise.reject(error);
  },
);
export const get = <T>(path: string, params?: object) =>
  api.get<T>(path, { params }).then((r) => r.data);
export function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    return Array.isArray(message)
      ? message[0]
      : typeof message === "string"
        ? message
        : error.code === "ERR_NETWORK"
          ? "We couldn’t reach the server. Please try again shortly."
          : "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}
export const money = (value: number | string, compact = false) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    ...(compact
      ? { notation: "compact" as const, maximumFractionDigits: 2 }
      : {}),
  }).format(Number(value));
export const number = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);
export const heroImage = "/images/hero.jpg";
