const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  uploadUrl: (cloudName) => `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
}

export { CLOUDINARY_CONFIG }
