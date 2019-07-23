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
from .common.constants import BaseConfig


class DefaultConfig(BaseConfig):
    PROJECT_URL = 'http://srv:5000'
    PROJECT_CDN_URL = 'http://srv:9000'

    DEBUG = True
    TESTING = True
    MAIL_DEBUG = True

    SECRET_KEY = ''  # TO SET
    SECURITY_PASSWORD_SALT = ''  # TO SET

    ADMINS = ['dev@politik-bei-uns.de']
    MAIL_FROM = 'dev@politik-bei-uns.de'

    MONGODB_HOST = 'mongodb'
    MONGODB_PORT = 27017
    MONGODB_DB = 'politik-bei-uns'

    ELASTICSEARCH_HOST = 'elasticsearch'

    S3_ENDPOINT = 'minio:9000'
    S3_ACCESS_KEY = 'DEVELOPMENT'
    S3_SECRET_KEY = 'DEVELOPMENT'

    MAPBOX_TOKEN = 'pk.eyJ1IjoicG9saXRpay1iZWktdW5zIiwiYSI6ImNpeGVvN2s3dTAwNTkydHBpcmMyOGFkd2UifQ.hBfikcNF8agOOXQrVfFCVQ'

    MAIL_SERVER = ''
    MAIL_USERNAME = ''
    MAIL_PASSWORD = ''


class DevelopmentConfig(DefaultConfig):
    MODE = 'DEVELOPMENT'


class StagingConfig(DefaultConfig):
    MODE = 'STAGING'


class ProductionConfig(DefaultConfig):
    MODE = 'PRODUCTION'


def get_config(MODE):
    SWITCH = {
        'DEVELOPMENT': DevelopmentConfig,
        'STAGING': StagingConfig,
        'PRODUCTION': ProductionConfig
    }
    return SWITCH[MODE]
