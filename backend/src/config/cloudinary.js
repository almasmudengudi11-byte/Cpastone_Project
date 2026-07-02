const cloudinary = require('cloudinary').v2;

const isMock = process.env.CLOUDINARY_CLOUD_NAME === 'mock_cloud' || !process.env.CLOUDINARY_CLOUD_NAME;

if (!isMock) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const cloudinaryConfig = {
  isMock,
  uploadFile: async (fileBuffer, folderName) => {
    if (isMock) {
      return `https://res.cloudinary.com/demo/image/upload/v12345678/mock_docs_${folderName}_${Math.random().toString(36).substr(2, 9)}.png`;
    }
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: folderName, resource_type: 'auto' },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error('Upload failed'));
          }
          resolve(result.secure_url);
        }
      ).end(fileBuffer);
    });
  }
};

module.exports = {
  cloudinary,
  cloudinaryConfig
};
