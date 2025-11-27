import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getGeolocation, initGeolocation } from "./geolocation";

initGeolocation();

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

function addGeolocationToData(data: unknown): unknown {
  const geolocation = getGeolocation();
  if (typeof data === "object" && data !== null) {
    return { ...data, geolocation };
  }
  return { geolocation };
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const dataWithGeo = data !== undefined ? addGeolocationToData(data) : addGeolocationToData({});
  
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dataWithGeo),
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const geolocation = getGeolocation();
    const url = new URL(queryKey.join("/") as string, window.location.origin);
    url.searchParams.set("_geo", JSON.stringify(geolocation));
    
    const res = await fetch(url.toString(), {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
