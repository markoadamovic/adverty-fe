import { useEffect, useState } from "react";
import { getValidAccessToken } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export function useDashboard() {
  const [state, setState] = useState({ data: null, loading: true, error: null, unauthenticated: false });

  useEffect(() => {
    (async () => {
      try {
        setState(s => ({ ...s, loading: true, error: null }));
        const token = await getValidAccessToken();
        const accountId = localStorage.getItem("accountId");
        if (!token || !accountId) {
          setState({ data: null, loading: false, error: null, unauthenticated: true });
          return;
        }
        const res = await fetch(`${API_BASE_URL}/account/${accountId}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error((await res.text()) || "Failed to load dashboard");
        const json = await res.json();
        setState({ data: json, loading: false, error: null, unauthenticated: false });
      } catch (e) {
        setState({ data: null, loading: false, error: e.message, unauthenticated: false });
      }
    })();
  }, []);

  return state; // { data, loading, error, unauthenticated }
}
