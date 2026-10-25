import { apiClient } from './client'

export interface FileMetadata {
  originalName: string
  storedName: string
  fileUrl: string
  fileSize: string
  contentType: string
}

export const filesApi = {
  uploadFile: async (file: File): Promise<FileMetadata> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await apiClient.post<FileMetadata>('/files/upload', formData)
    return res.data
  }
}
