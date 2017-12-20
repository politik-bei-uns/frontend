# encoding: utf-8

"""
Copyright (c) 2012 - 2016, Ernesto Ruge
All rights reserved.
Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
"""

from mongoengine import Document, EmbeddedDocument, BooleanField, ReferenceField, DateTimeField, IntField, StringField, \
    ListField, DecimalField, DictField, EmbeddedDocumentListField
from .oparl_document import OParlDocument


class File(Document, OParlDocument):
    meta = {
        'indexes': [
            {
                'fields': ['$name', "$text", 'body'],
                'default_language': 'english',
                'weights': {'name': 10, 'text': 2}
            }
        ]
    }

    type = 'https://schema.oparl.org/1.0/File'
    body = ReferenceField('Body', dbref=False, deref_location=False)
    name = StringField(fulltext=True)
    fileName = StringField()
    mimeType = StringField()
    date = DateTimeField(datetime_format='date')
    size = DecimalField()
    sha1Checksum = StringField()
    text = StringField(fulltext=True)
    accessUrl = StringField()
    downloadUrl = StringField()
    externalServiceUrl = StringField()
    masterFile = ReferenceField('File', dbref=False, deref_location=False)
    derivativeFile = ListField(ReferenceField('File', dbref=False, deref_location=False), default=[])
    fileLicense = StringField()
    meeting = ListField(ReferenceField('Meeting', dbref=False, deref_location=False), default=[])
    agendaItem = ListField(ReferenceField('AgendaItem', dbref=False, deref_location=False), default=[])
    paper = ListField(ReferenceField('Paper', dbref=False, deref_location=False), default=[])
    location = ListField(ReferenceField('Location', dbref=False, deref_location=False), default=[])
    license = StringField()
    keyword = ListField(StringField(fulltext=True), default=[])
    created = DateTimeField(datetime_format='datetime')
    modified = DateTimeField(datetime_format='datetime')
    web = StringField()
    deleted = BooleanField()

    # Politik bei Uns Felder
    downloaded = BooleanField(vendor_attribute=True)
    originalId = StringField()
    originalWeb = StringField()
    originalAccessUrl = StringField()
    originalDownloadUrl = StringField()
    textGenerated = DateTimeField(datetime_format='datetime')
    textStatus = StringField()
    thumbnailGenerated = DateTimeField(datetime_format='datetime')
    thumbnailStatus = StringField()
    georeferencesGenerated = DateTimeField(datetime_format='datetime')
    georeferencesStatus = StringField()
    thumbnail = DictField()
    pages = IntField()
    keyword_usergenerated = EmbeddedDocumentListField('KeywordUsergenerated')


    # Felder zur Verarbeitung
    _object_db_name = 'file'
    _attribute = 'file'

    def __init__(self, *args, **kwargs):
        super(Document, self).__init__(*args, **kwargs)

    def __repr__(self):
        return '<File %r>' % self.name
