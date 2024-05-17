'''
This file will handle all the configuration settings for your application.
It can include environment-specific settings such as the paths to data files, database URIs, secret keys, etc.
'''

import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'your_secret_key_here')
    DATA_FOLDER = os.getenv('DATA_FOLDER', 'data/')
    IMAGE_FOLDER = os.getenv('IMAGE_FOLDER', os.path.join('static', 'images'))

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config_by_name = dict(
    dev=DevelopmentConfig,
    prod=ProductionConfig
)
