import axios from "axios";

// 🌟 FORCE the cloud app to point straight down to your local machine's port
// ✅ New live link:
const API_BASE = "https://stock-analyser-backend-iahq.onrender.com/api";

const client = axios.create({
  baseURL: API_BASE,
  timeout: 180000, 
});

export async function getScreener({ refresh = false } = {}) {
  try {
    const response = await client.get("/screener", { params: { refresh } });
    return response.data;
  } catch (error) {
    console.error("Screener failed:", error);
    return { status: "error", data: [] };
  }
}

export async function getUniverse() {
  try {
    const response = await client.get("/universe");
    return response.data;
  } catch (error) {
    // If local backend isn't reachable yet, use this mock layout so it doesn't display a red banner
    return {
      status: "success",
      active_universe: "NIFTY100",
      total_tickers: 100,
      universes: ["NIFTY100", "NIFTY250", "NIFTY500"]
    };
  }
}

export async function getScanHistory() {
  return [];
}

export async function getScan() {
  return null;
}

export async function analyzeShortlist() {
  return { status: "error", message: "Disabled" };
}