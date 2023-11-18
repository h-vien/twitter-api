import fs from 'fs'
import path from 'path'
export const initFolder = () => {
  const folderPath = path.resolve('uploads/images')
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, {
      recursive: true // Muc dich tao folder nested
    })
  }
}
