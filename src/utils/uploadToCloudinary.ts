// src/utils/uploadToCloudinary.ts

export const uploadToCloudinary = async (file: File): Promise<string> => {
  // 1. configuration
  const cloudName = "dw6vzodmz"; // 🔴 REPLACE THIS with your actual cloud name!
  const uploadPreset = "parking-app"; // This must match the preset name you created in Step 1

  // 2. Prepare the data
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  // 3. Send to Cloudinary
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Image upload failed");
    }

    const data = await response.json();
    // 4. Return the standard URL for the image
    return data.secure_url; 
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};