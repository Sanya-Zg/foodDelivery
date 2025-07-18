import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLODINARY_CLOUD_NAME,
  api_key: process.env.CLODINARY_API_KEY,
  api_secret: process.env.CLODINARY_SECRET_API_KEY,
});

const uploadImageCloudinary = async (image) => {
  const buffer = image.buffer || Buffer.from(await image.arrayBuffer());

  const uploadImage = await new Promise((res, rej) => {
    cloudinary.uploader
      .upload_stream({ folder: 'binkeyit' }, (error, uploadResult) => {
        return res(uploadResult);
      })
      .end(buffer);
  });
  return uploadImage;
};
export default uploadImageCloudinary;
