'''
Utility functions used across the application.
'''


import numpy as np
import cv2
from cv2 import resize as rsz
from skimage.transform import resize
from skimage.metrics import structural_similarity as ssim
from scipy.spatial.distance import directed_hausdorff
from scipy.ndimage import distance_transform_edt, center_of_mass, shift, binary_erosion
from ultralytics import YOLO
import os


def load_npz_data(filepath):
    return np.load(filepath, allow_pickle=True)

def load_yolo_model(model_path='yolov8m-seg.pt'):
    return YOLO(model_path)
    # return 'YOLO model loaded'

# ------------------------------------------------------------------------------------------------------------

def calculate_shift_to_center(img):
    centroid = center_of_mass(img)
    shape_center = np.array(img.shape) / 2
    return shape_center - np.array(centroid)


def resize_and_center(input_img, target_shape):
    input_img = input_img.astype(np.uint8)

    scale = min(target_shape[0] / input_img.shape[0], target_shape[1] / input_img.shape[1])
    new_size = (int(input_img.shape[0] * scale), int(input_img.shape[1] * scale))

    resized_img = resize(input_img, new_size, preserve_range=True, anti_aliasing=True).astype(np.uint8)

    shift_required = calculate_shift_to_center(resized_img)

    centered_img = shift(resized_img, shift_required, mode='constant', cval=0).astype(np.uint8)

    pad_height = (target_shape[0] - centered_img.shape[0]) // 2
    pad_width = (target_shape[1] - centered_img.shape[1]) // 2
    padded_img = np.pad(centered_img,
                        ((pad_height, target_shape[0] - centered_img.shape[0] - pad_height),
                         (pad_width, target_shape[1] - centered_img.shape[1] - pad_width)),
                        mode='constant', constant_values=0).astype(np.uint8)

    return padded_img


# ------------------------------------------------------------------------------------------------------------

def apply_color_mask(image, mask, color, alpha=0.4):
    overlay = image.copy()
    for c in range(3):
        overlay[:, :, c] = np.where(mask == 1,
                                    image[:, :, c] * (1 - alpha) + alpha * color[c],
                                    image[:, :, c])
    return overlay

'''
- Create a colored mask image and a silhouette image from the mask coordinates and the original image
'''
def create_obj_images(object_id, mask_coords, orig_image_path, overlay_color, accumulated_image):
    orig_image = cv2.imread(orig_image_path)
    resized_mask = rsz(mask_coords, (orig_image.shape[1], orig_image.shape[0]), interpolation=cv2.INTER_NEAREST)

    # Apply color mask to the original image for the individual object
    colored_img = apply_color_mask(orig_image, resized_mask, overlay_color)

    # Apply color mask to the accumulating image for all objects
    accumulated_image = apply_color_mask(accumulated_image, resized_mask, overlay_color)

    # Create a silhouette image
    silhouette = np.where(mask_coords == 1, 255, 0).astype(np.uint8)
    centered_silhouette = resize_and_center(silhouette, orig_image.shape[:2])
    # take centered_silhouette and flip the 0's to 255 and the 255's to 0
    centered_silhouette = 255 - centered_silhouette
    
    colored_mask_path = generate_url(object_id, orig_image_path, type='colored_mask')
    silhouette_path = generate_url(object_id, orig_image_path, type='silhouette')

    cv2.imwrite(colored_mask_path, colored_img)
    cv2.imwrite(silhouette_path, centered_silhouette)
    
    return_colored_mask_path = f'http://localhost:5000/{colored_mask_path}'

    return_silhouette_path = f'http://localhost:5000/{silhouette_path}'


    return return_colored_mask_path, return_silhouette_path, accumulated_image




# ------------------------------------------------------------------------------------------------------------


def generate_url(object_id, image_url, type=None):
    image_name = os.path.basename(image_url)
    # get image name without extension
    image_name = os.path.splitext(image_name)[0]
    new_name = os.path.join(f"{type}", f"{image_name}_obj-{object_id}.jpg")
    
    generated_url = os.path.join(os.path.dirname(image_url), new_name)

    return generated_url



# ------------------------------------------------------------------------------------------------------------


def extract_outline(binary_image):
    return binary_image - binary_erosion(binary_image)


def arr_to_binary(arr):
   return (arr / 255).astype(np.uint8)
# ------------------------------------------------------------------------------------------------------------

def hamming_dist(arr1, arr2):
  return np.sum(arr1 == arr2)

# -------------------------------------------------------------------------------

def ssim_index(arr1, arr2):
  return ssim(arr1, arr2)

# -------------------------------------------------------------------------------

def chamfer_dist(arr1, arr2):
    outline1 = extract_outline(arr1)
    outline2 = extract_outline(arr2)

    outline1_edt = distance_transform_edt(1 - outline1)
    outline2_edt = distance_transform_edt(1 - outline2)

    chamfer1 = (outline1_edt * outline2).sum()
    chamfer2 = (outline2_edt * outline1).sum()

    average_chamfer = (chamfer1 + chamfer2) / 2
    # score should approach 1 as chamfer distance approaches 0
    return 1 / (1 + average_chamfer)

# -------------------------------------------------------------------------------

def hausdorff_dist(arr1, arr2):
  arr1_indicies = np.argwhere(arr1)
  arr2_indicies = np.argwhere(arr2)

  hausdorff1 = directed_hausdorff(arr1_indicies, arr2_indicies)[0]
  hausdorff2 = directed_hausdorff(arr2_indicies, arr1_indicies)[0]

  max_hausdorff = max(hausdorff1, hausdorff2)
  # score should approach 1 as hausdorff distance approaches 0
  return 1 / (1 + max_hausdorff)


# -------------------------------------------------------------------------------

def dice_score(arr1, arr2):
  intersection = np.logical_and(arr1, arr2).sum()
  size1 = arr1.sum()
  size2 = arr2.sum()

  if size1 + size2 == 0:
    return 1.0

  return 2.0 * intersection / (size1 + size2)

# -------------------------------------------------------------------------------

def jaccard_score(arr1, arr2):
  intersection = np.logical_and(arr1, arr2).sum()
  union = np.logical_or(arr1, arr2).sum()

  if union == 0:
    return 1.0

  return intersection / union

# -------------------------------------------------------------------------------

def get_similarity_methods():
    return {
    "hamming": hamming_dist,
    "ssim": ssim_index,
    "chamfer": chamfer_dist,
    "hausdorff": hausdorff_dist,
    "dice": dice_score,
    "jaccard": jaccard_score
}

