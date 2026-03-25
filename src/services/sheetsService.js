// ===== GOOGLE SHEETS SERVICE =====
// Raw fetch wrappers for Google Sheets API v4

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

export const sheetsService = {
  /**
   * Read all movements from the sheet
   */
  async readMovements(spreadsheetId, accessToken, sheetName = 'Movimientos') {
    const range = encodeURIComponent(`${sheetName}!A:H`)
    const url = `${SHEETS_BASE}/${spreadsheetId}/values/${range}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) throw new Error(`Sheets API error: ${res.status}`)
    const data = await res.json()
    return data.values || []
  },

  /**
   * Ensure the header row exists in the sheet
   */
  async ensureHeaderRow(spreadsheetId, accessToken, sheetName = 'Movimientos') {
    const existing = await this.readMovements(spreadsheetId, accessToken, sheetName)
    if (existing.length === 0) {
      const headers = [['id', 'fecha', 'proyecto', 'tipo', 'item', 'monto', 'descripcion', 'proyecto_id']]
      await this.appendRows(spreadsheetId, accessToken, sheetName, headers)
    }
  },

  /**
   * Append movement rows to the sheet
   */
  async appendMovements(spreadsheetId, accessToken, movements, projectMap = {}, sheetName = 'Movimientos') {
    const rows = movements.map(m => [
      m.id,
      m.date,
      projectMap[m.projectId] || m.projectId,
      m.type,
      m.itemLabel,
      m.amount,
      m.description,
      m.projectId,
    ])
    return this.appendRows(spreadsheetId, accessToken, sheetName, rows)
  },

  async appendRows(spreadsheetId, accessToken, sheetName, rows) {
    const range = encodeURIComponent(`${sheetName}!A:H`)
    const url = `${SHEETS_BASE}/${spreadsheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rows }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(`Sheets API error: ${err.error?.message || res.status}`)
    }
    return res.json()
  },

  /**
   * Clear all data and re-append (full resync)
   */
  async clearAndResync(spreadsheetId, accessToken, movements, projectMap = {}, sheetName = 'Movimientos') {
    const range = encodeURIComponent(`${sheetName}!A:H`)
    // Clear
    await fetch(`${SHEETS_BASE}/${spreadsheetId}/values/${range}:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    // Re-add header
    await this.ensureHeaderRow(spreadsheetId, accessToken, sheetName)
    // Re-add all movements
    if (movements.length > 0) {
      await this.appendMovements(spreadsheetId, accessToken, movements, projectMap, sheetName)
    }
  },

  /**
   * Get spreadsheet metadata (to verify access and get sheet names)
   */
  async getSpreadsheetInfo(spreadsheetId, accessToken) {
    const res = await fetch(`${SHEETS_BASE}/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) throw new Error(`No se pudo acceder a la hoja: ${res.status}`)
    return res.json()
  },

  /**
   * Refresh an OAuth access token using refresh token
   */
  async refreshAccessToken(refreshToken, clientId, clientSecret) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })
    if (!res.ok) throw new Error('No se pudo renovar el token')
    return res.json() // { access_token, expires_in }
  },
}
