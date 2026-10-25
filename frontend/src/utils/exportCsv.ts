/**
 * Utility xuất dữ liệu dạng CSV với UTF-8 BOM (\uFEFF)
 * Tương thích 100% với Microsoft Excel trên Windows (không bao giờ bị lỗi font tiếng Việt)
 */
export const exportToCsv = (
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): void => {
  const BOM = '\uFEFF'
  
  const escapeCell = (cell: unknown): string => {
    if (cell === null || cell === undefined) return '""'
    const str = String(cell).replace(/"/g, '""')
    return `"${str}"`
  }

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map(row => row.map(escapeCell).join(','))
  ].join('\r\n')

  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  const todayStr = new Date().toISOString().split('T')[0]
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${todayStr}.csv`)
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
