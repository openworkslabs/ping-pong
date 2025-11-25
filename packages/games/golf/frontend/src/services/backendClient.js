const API_BASE = '/api'

export const backendClient = {
  async getConfig() {
    const res = await fetch(`${API_BASE}/config`)
    return res.json()
  },

  async submitScore(data) {
    const res = await fetch(`${API_BASE}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return res.json()
  },

  async getLeaderboard() {
    const res = await fetch(`${API_BASE}/leaderboard`)
    return res.json()
  },

  connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`)

    return new Promise((resolve, reject) => {
      ws.onopen = () => resolve(ws)
      ws.onerror = reject
    })
  }
}