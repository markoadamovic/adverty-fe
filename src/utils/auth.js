import { jwtDecode } from "jwt-decode";

const API_BASE_URL = "http://localhost:8080"

export function isTokenExpired(token) {
  try {
    const { exp } = jwtDecode(token)
    if (!exp) return true
    return Date.now() >= exp * 1000
  } catch {
    return true
  }
}

export async function getValidAccessToken() {
    let token = localStorage.getItem("accessToken")

    if (!token || isTokenExpired(token)) {
        const refreshToken = localStorage.getItem("refreshToken")
        if (!refreshToken) return null

        const res = await fetch(`${API_BASE_URL}/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        })

        if(res.ok) {
            const data = await res.json()
            localStorage.setItem("accessToken", data.accessToken)
            token = data.accessToken
        } else {
            return null
        }
    } 

    return token
}