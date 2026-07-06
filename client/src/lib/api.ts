import { supabase } from "./supabase";

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export async function getAuthToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

// Map the old mock URLs to the new backend endpoints to preserve locked frontend contracts
function mapUrl(url: string) {
  if (url === "/user/profile") return "/users/profile";
  if (url === "/dashboard/summary") return "/dashboard/summary";
  if (url === "/dashboard/analytics") return "/dashboard/analytics";
  if (url === "/medications/today") return "/medications/today";
  if (url === "/medications") return "/medications";
  if (url === "/emergency") return "/emergency";
  if (url === "/notifications") return "/notifications";
  if (url.startsWith("/notifications/")) return url;
  if (url === "/family") return "/family";
  if (url.startsWith("/family/")) return url;
  if (url.startsWith("/wellness/")) return url;
  if (url === "/feedback") return "/feedback";
  if (url === "/settings/preferences" || url === "/settings/export" || url === "/settings/account")
    return url;
  if (url === "/ai/chat") return "/ai/chat";
  if (url === "/doses/today") return "/medications/today";
  if (url.startsWith("/doses/")) {
    const id = url.split("/")[2];
    return `/medications/doses/${id}`;
  }
  return url;
}

export const fetcher = async (url: string) => {
  const token = await getAuthToken();
  const backendUrl = mapUrl(url);

  const res = await fetch(`${API_BASE}${backendUrl}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  // Handle potential nested data structure from pagination
  const json = await res.json();
  if (json.data && json.meta) {
    return json.data;
  }
  return json;
};

export const updater = async (url: string, data: unknown, method: string = "POST") => {
  const token = await getAuthToken();
  const backendUrl = mapUrl(url);

  const res = await fetch(`${API_BASE}${backendUrl}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  return res.json();
};
