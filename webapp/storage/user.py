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

from werkzeug.security import check_password_hash
from passlib.hash import bcrypt
from datetime import datetime
from itsdangerous import URLSafeTimedSerializer
from flask_mail import Message
from hashlib import sha256
from flask_login import login_user
from ..extensions import mail
from flask import current_app, render_template
from mongoengine import Document, BooleanField, ReferenceField, DateTimeField, StringField, ListField, \
    DecimalField, EmailField, IntField, GeoJsonBaseField


class User(Document):
    created = DateTimeField(default=datetime.utcnow())
    modified = DateTimeField(default=datetime.utcnow())
    last_login = DateTimeField()

    email = StringField()
    _password = StringField(db_field='password')
    active = BooleanField()
    type = StringField()

    subscription_frequency = StringField(default='week') #day, week
    html_emails = BooleanField(default=True)

    def is_authenticated(self):
        return True

    def is_active(self):
        return self.active

    def is_anonymous(self):
        return False

    def get_id(self):
        return str(self.id)

    @staticmethod
    def validate_login(password_hash, password):
        return check_password_hash(password_hash, password)

    # password should be encrypted
    @property
    def password(self):
        return self._password

    @password.setter
    def password(self, password):
        self._password = bcrypt.hash(password)

    def check_password(self, password):
        """
        Ueberprueft das Passwort des Nutzers
        """
        if self.password is None:
            return False
        return bcrypt.verify(password, self.password)

    @classmethod
    def authenticate(self, email, password, remember):
        """
        Authentifiziert einen Nutzer
        """
        user = User.objects(email=email).first()

        if user:
            authenticated = user.check_password(password) and user.active
            if authenticated:
                login_user(user, remember=bool(remember))
        else:
            authenticated = False
        return user, authenticated


    @classmethod
    def email_exists(self, email):
        user = User.objects(email=email)
        return user.count() > 0

    def send_validation_email(self):
        recover_serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        validation_url = "%s/validate-email?id=%s" % (
            current_app.config['PROJECT_URL'],
            recover_serializer.dumps([str(self.id), sha256(str.encode(self.password)).hexdigest()],
                                     salt=current_app.config['SECURITY_PASSWORD_SALT'])
        )
        msg = Message(
            "Ihre Registrierung bei Politik bei Uns",
            sender=current_app.config['MAILS_FROM'],
            recipients=[self.email],
            body=render_template('emails/validate-email.txt', user=self, validation_url=validation_url)
        )
        mail.send(msg)

    def send_recover_email(self):
        recover_serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        validation_url = "%s/recover-check?id=%s" % (
            current_app.config['PROJECT_URL'],
            recover_serializer.dumps([str(self.id), sha256(str.encode(self.password)).hexdigest()],
                                     salt=current_app.config['SECURITY_PASSWORD_SALT'])
        )
        msg = Message(
            "Passwort zurücksetzen auf Politik bei Uns",
            sender=current_app.config['MAILS_FROM'],
            recipients=[self.email],
            body=render_template('emails/recover-email.txt', user=self, validation_url=validation_url)
        )
        mail.send(msg)


    def __init__(self, *args, **kwargs):
        super(Document, self).__init__(*args, **kwargs)

    def __repr__(self):
        return '<User %r>' % self.email
