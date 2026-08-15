export const seprateImages = (selectedImages, currentImages) => {
  const existingImagesIds = Array.isArray(selectedImages) ? selectedImages : [selectedImages].filter(Boolean);
  const keepingImages = currentImages.filter(img=> existingImagesIds.includes(String(img._id)));
  const removingImages = currentImages.filter(img=> !existingImagesIds.includes(String(img._id)))
  return {keepingImages, removingImages}
}