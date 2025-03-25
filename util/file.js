import { v2 as cloudinary } from "cloudinary";

const deleteFile = (imageUrl) => {
  if (!imageUrl) {
    console.error("No imageUrl provided for deletion");
    return;
  }

  // Extract public ID from the Cloudinary URL.
  // Cloudinary URLs typically look like:
  // https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<public_id>.<format>
  const regex = /\/upload\/(?:v\d+\/)?([^\.]+)\.[a-z]+$/i;
  const match = imageUrl.match(regex);

  if (match && match[1]) {
    const publicId = match[1];
    console.log("Deleting Cloudinary image with public id:", publicId);

    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error("Error deleting image from Cloudinary:", error);
      } else {
        console.log("Cloudinary image deletion result:", result);
      }
    });
  } else {
    console.error("Could not extract public id from URL:", imageUrl);
  }
};

export default deleteFile;
