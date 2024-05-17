from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
import os

from services import process_image as service_process_image, get_most_simliar
from utils import load_npz_data, load_yolo_model


def create_app():
    app = Flask(__name__, static_folder='static')
    CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
    app.config.from_object('config.DevelopmentConfig')

    # Load resources
    app.config['YOLO_MODEL'] = load_yolo_model('yolov8m-seg.pt')
    app.config['countries_NPZ_DATA'] = load_npz_data('data/country_arrays.npz')
    app.config['us_states_NPZ_DATA'] = load_npz_data('data/us_states_arrays.npz')
    app.config['lakes_and_reservoirs_NPZ_DATA'] = load_npz_data('data/lakes_and_reservoirs_arrays.npz')

    # Initialize MongoDB client
    mongo_url = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    mongo_client = MongoClient(mongo_url)
    db = mongo_client["image_comparator"]
    rankings_collection = db["rankings"]

    @app.route('/static/<path:path>')
    def send_static(path):
        return send_from_directory('static', path)

    @app.route('/api/images/process', methods=['POST'])
    def process_image_endpoint():
        image = request.files['image']
        if not image:
            return jsonify({'error': 'No image provided'}), 400
        
        image_path = os.path.join(app.config['IMAGE_FOLDER'], image.filename)
        image.save(image_path)
        result = service_process_image(image_path)
        return jsonify(result), 200

    @app.route('/api/objects/compare', methods=['POST'])
    def compare_objects_endpoint():
        data = request.json
        mask_coords = data.get('mask_coords')
        category_id = data.get('category_id')
        object_id = data.get('object_id')
        image_file_name = data.get('image_file_name')
        compare_method = data.get('compare_method')
        if not mask_coords or not category_id or not image_file_name or not compare_method:
            return jsonify({'error': 'Missing required parameters'}), 400
        result = get_most_simliar(mask_coords, category_id, object_id, image_file_name, method=compare_method)
        return jsonify(result), 200

    @app.route('/api/objects/compare_all', methods=['POST'])
    def compare_objects_all_methods_endpoint():
        data = request.json
        mask_coords = data.get('mask_coords')
        category_id = data.get('category_id')
        object_id = data.get('object_id')
        image_file_name = data.get('image_file_name')
        if not mask_coords or not category_id or not image_file_name:
            return jsonify({'error': 'Missing required parameters'}), 400
        results = {}
        methods = ['hamming', 'ssim', 'chamfer', 'hausdorff', 'dice', 'jaccard']
        for method in methods:
            results[method] = get_most_simliar(mask_coords, category_id, object_id, image_file_name, method=method)
        return jsonify(results), 200

    @app.route('/api/rankings/submit', methods=['POST'])
    def submit_rankings_endpoint():
        print('submit ranking called')
        data = request.json
        session_id = data.get('session_id')
        image_file_name = data.get('image_file_name')
        object_id = data.get('object_id')
        category_id = data.get('category_id')
        rankings = data.get('rankings')
        print(f"submit ranking called: rankings - {rankings}")
        if not image_file_name or not category_id or not rankings:
            return jsonify({'error': 'Missing required parameters'}), 400

        ranking_data = {
            'session_id': session_id,
            'image_file_name': image_file_name,
            'object_id': object_id,
            'category_id': category_id,
            'rankings': rankings
        }
        rankings_collection.insert_one(ranking_data)
        
        return jsonify({'status': 'success'}), 200


    @app.route('/api/rankings/get', methods=['GET'])
    def get_rankings_endpoint():
        pipeline = [
            # Group by unique attributes to find unique entries
            {
                "$group": {
                    "_id": {
                        "session_id": "$session_id",
                        "image_file_name": "$image_file_name",
                        "object_id": "$object_id",
                        "category_id": "$category_id"
                    },
                    "rankings": {
                        "$first": "$rankings"
                    }
                }
            },
            # Unwind the rankings object to prepare for summing each method
            {
                "$unwind": "$rankings"
            },
            {
                "$group": {
                    "_id": None,
                    "hamming": {"$sum": "$rankings.hamming"},
                    "ssim": {"$sum": "$rankings.ssim"},
                    "chamfer": {"$sum": "$rankings.chamfer"},
                    "hausdorff": {"$sum": "$rankings.hausdorff"},
                    "dice": {"$sum": "$rankings.dice"},
                    "jaccard": {"$sum": "$rankings.jaccard"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "hamming": "$hamming",
                    "ssim": "$ssim",
                    "chamfer": "$chamfer",
                    "hausdorff": "$hausdorff",
                    "dice": "$dice",
                    "jaccard": "$jaccard"
                }
            }
        ]

        results = list(rankings_collection.aggregate(pipeline))

        if results:
            return jsonify({'rankingTotals': results[0]}), 200
        else:
            return jsonify({'rankingTotals': {}}), 200

        


    return app

app = create_app()

if __name__ == '__main__':
    from waitress import serve
    serve(app, host='0.0.0.0', port=5000)
