import os

import fabric.api

BASE_DIR = os.path.dirname(__file__)


def serve():
    fabric.api.local('python application.py')
