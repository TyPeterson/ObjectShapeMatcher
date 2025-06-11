'''
Handles the core functionality and business logic, independent of the web request/response cycle.
'''
from flask import current_app as app
import numpy as np
import cv2
import os

from utils import create_obj_images, get_similarity_methods, arr_to_binary, resize_and_center
from models import DetectedObject, get_colors_dict


def process_image(image_path):
    model = app.config['YOLO_MODEL']
    curr_prediction = model(image_path)
    object_type_dict = curr_prediction[0].names
    
    # Create copy of original image for accumulation of color masks
    accumulated_mask = cv2.imread(image_path)
    accumulated_mask_path = image_path[:image_path.rfind('.')] + '_all_colored_mask.jpg'

    objects_info = []
    for i in range(len(curr_prediction[0].boxes.cls)):
        object_id = i
        cur_obj_code = int(curr_prediction[0].boxes.cls[i])
        object_type = object_type_dict[cur_obj_code] + "1"

        # Ensure unique names for each object
        existing_object_types = [obj['object_type'] for obj in objects_info]
        while object_type in existing_object_types:
            object_type = object_type[:-1] + str(int(object_type[-1]) + 1)

        mask_coords = curr_prediction[0].masks[object_id].data[0].numpy().astype(np.uint8)
        overlay_color = np.array(get_colors_dict()[object_id], dtype=np.uint8)

        # Pass the accumulated mask image to be updated
        colored_mask_path, silhouette_path, accumulated_mask = create_obj_images(
            object_id, mask_coords, image_path, overlay_color, accumulated_mask
        )

        cur_detected_obj = DetectedObject(object_id, object_type, mask_coords, colored_mask_path, silhouette_path)
        objects_info.append(cur_detected_obj.serialize())

    # print first objects mask_coords attribute
    

    # Save the final accumulated mask image
    cv2.imwrite(accumulated_mask_path, accumulated_mask)
    # print(f'accumulated_mask shape: {accumulated_mask.shape}')
    # prepend the base localhost url to accumulated_mask_path
    accumulated_mask_path = os.path.join('http://localhost:5000/', accumulated_mask_path)
    return {
        'objects': objects_info,
        'composite_image_url': accumulated_mask_path
    }



def get_most_similar(mask_coords, category_id, object_id, image_file_name, method="hamming"):
    mask_coords = np.array(mask_coords)
    data = app.config[f'{category_id}_NPZ_DATA']

    # resize using the shape of the first item in the data dict
    resized_mask_coords = resize_and_center(mask_coords, next(iter(data.values())).shape)

    sim_scores = {}
    for item, array in data.items():
        item_array = arr_to_binary(array)
        sim_scores[item] = get_similarity_methods()[method](resized_mask_coords, item_array)

    most_similar = max(sim_scores, key=sim_scores.get)

    image_file_name = os.path.splitext(image_file_name)[0]
    
    image_path = os.path.join(app.config['IMAGE_FOLDER'], "silhouette")

    image_silhouette_name = f"{image_file_name}_obj-{object_id}.jpg"
    path_and_name = os.path.join(image_path, image_silhouette_name)

    return_mask_url = f'http://localhost:5000/{path_and_name}'

    return {
        'most_similar': most_similar,
        'mask_url': return_mask_url
    }