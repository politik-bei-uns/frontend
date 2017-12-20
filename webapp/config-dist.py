# encoding: utf-8

"""
Copyright (c) 2017, Ernesto Ruge
All rights reserved.
Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
"""

import os
from .common.constants import INSTANCE_FOLDER_PATH


class DefaultConfig(object):
    PROJECT_NAME = "politik-bei-uns-frontend"
    PROJECT_URL = ''
    PROJECT_CDN_URL = ''
    PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
    PROJECT_VERSION = '0.0.1'
    LOG_DIR = os.path.abspath(os.path.join(PROJECT_ROOT, os.pardir, 'logs'))

    DEBUG = True
    TESTING = True

    SECRET_KEY = ''
    SECURITY_PASSWORD_SALT = ''

    ADMINS = []
    MAILS_FROM = ''

    MONGODB_HOST = 'localhost'
    MONGODB_PORT = 27017
    MONGODB_DB = ''

    ELASTICSEARCH_HOST = ''

    S3_ENDPOINT = '127.0.0.1:9000'
    S3_ACCESS_KEY = ''
    S3_SECRET_KEY = ''
    S3_SECURE = False
    S3_BUCKET = ''
    S3_LOCATION = 'us-east-1'

    MAPBOX_TOKEN = ''

    MAIL_SERVER = ''
    MAIL_PORT = 465
    MAIL_USE_SSL = True
    MAIL_USERNAME = ''
    MAIL_PASSWORD = ''
    MAIL_DEBUG = True
    MAIL_SUPPRESS_SEND = False


class DevelopmentConfig(DefaultConfig):
    pass


class StagingConfig(DefaultConfig):
    pass


class ProductionConfig(DefaultConfig):
    pass


def get_config(MODE):
    SWITCH = {
        'DEVELOPMENT': DevelopmentConfig,
        'STAGING': StagingConfig,
        'PRODUCTION': ProductionConfig
    }
    return SWITCH[MODE]
