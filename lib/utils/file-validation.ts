export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export function validateFile(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 5MB limit')
  }
  
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error('File type not supported. Please upload a JPEG, PNG, GIF or WebP image.')
  }
  
  return true
} 