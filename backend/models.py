
class DetectedObject:
    def __init__(self, object_id, object_type, mask_coords, mask_path, silhouette_path):
        self.object_id = object_id
        self.object_type = object_type
        self.mask_coords = mask_coords
        self.colored_mask_path = mask_path
        self.object_silhouette_path = silhouette_path


    def serialize(self):
        return {
            'object_id': self.object_id,
            'object_type': self.object_type,
            'mask_coords': self.mask_coords.tolist(),
            'colored_mask_path': self.colored_mask_path,
            'object_silhouette_path': self.object_silhouette_path
        }



def get_colors_dict():
    return  {
  0: [0, 0, 200],
  1: [0, 200, 0],
  2: [200, 0, 0],
  3: [200, 200, 0],
  4: [200, 0, 200],
  5: [0, 200, 200],
  6: [123, 300, 12],
  7: [100, 0, 0],
  8: [0, 100, 0],
  9: [0, 0, 100],
  10: [100, 100, 0],
  11: [100, 0, 100],
  12: [0, 100, 100],
  13: [100, 10, 1],
  14: [50, 0, 0],
  15: [0, 50, 0],
  16: [0, 0, 50],
  17: [50, 50, 0],
  18: [50, 0, 50],
  19: [0, 50, 50],
  20: [50, 50, 50],
  21: [25, 0, 0],
  22: [0, 25, 0],
  23: [0, 0, 25],
  24: [25, 25, 0],
  25: [25, 0, 25],
  26: [0, 25, 25],
  27: [25, 25, 25],
  28: [255, 255, 255],
}

