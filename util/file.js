import fs from "fs";
import path from "path";

const deleteFile = (filePath) => {
  // Construct the full path
  const fullPath = path.join("images", filePath);

  console.log("Full path -->", fullPath);

  fs.unlink(fullPath, (err) => {
    if (err) {
      // Log error instead of throwing
      console.error("Error deleting file:", err);
      return;
    }
    console.log("File deleted successfully:", fullPath);
  });
};

export default deleteFile;
