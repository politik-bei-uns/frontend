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

import datetime
from hashlib import sha256
from itsdangerous import URLSafeTimedSerializer
from flask import (Flask, Blueprint, render_template, current_app, request, flash, url_for, redirect, session, abort,
                   jsonify, send_from_directory)
from flask_login import login_required, login_user, current_user, logout_user, confirm_login, login_fresh
from .UserForms import *
from ..models import User

user = Blueprint('user', __name__, template_folder='templates')


@user.route('/login', methods=['GET', 'POST'])
def login_main():
    if current_user.is_authenticated:
        return redirect('/')
    redirect_to = request.args.get('redirect_to', '')
    # check if path is valid
    if redirect_to:
        try:
            route_check = current_app.url_map.bind('localhost').match(redirect_to, 'GET')
        except:
            abort(403)
    form = LoginForm()
    if form.validate_on_submit():
        user, authenticated = User.authenticate(form.email.data, form.password.data, form.remember_me.data)
        if authenticated:
            user.last_login = datetime.datetime.utcnow()
            user.save()
            flash('Login erfolgreich.', 'success')
            if redirect_to:
                return redirect(redirect_to)
            else:
                return redirect('/')
        flash('Zugangsdaten nicht korrekt', 'danger')
    return render_template('login.html', form=form, redirect_to=redirect_to)

@user.route('/logout')
def logout():
    session.pop('login', None)
    logout_user()
    flash('Sie haben sich erfolgreich ausgeloggt.', 'success')
    return redirect('/')

@user.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect('/')
    form = RegisterForm()
    if form.validate_on_submit():
        error_found = False
        if User.email_exists(form.email.data):
            error_found = True
            form.email.errors.append('E-Mail-Adresse ist schon registriert.')
        else:
            user = User()
            user.email = form.email.data.lower()
            user.password = form.password.data
            user.save()

            user.send_validation_email()

            return render_template('register-success.html')
    return render_template('register.html', form=form)


@user.route('/validate-email')
def validate_email():
    serialized_data = request.args.get('id', '')
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        data = serializer.loads(
            serialized_data,
            salt=current_app.config['SECURITY_PASSWORD_SALT'],
            max_age=60 * 60 * 24 * 7
        )
    except:
        data = False
    if data == False:
        return render_template('activation-fail.html')
    else:
        if not len(data) == 2:
            return render_template('activation-fail.html')
        else:
            user = User.objects(id=data[0])
            if user.count() != 1:
                return render_template('activation-fail.html')
            else:
                user = user.first()
                if sha256(str.encode(user.password)).hexdigest() != data[1]:
                    return render_template('activation-fail.html')
                else:
                    user.active = True
                    user.save()
                    flash('Aktivierung erfolgreich.', 'success')
                    return redirect('/login')

@user.route('/account/password', methods=['GET', 'POST'])
@login_required
def account_passwort():
    form = PasswordForm()
    if form.validate_on_submit():
        if current_user.check_password(form.old_password.data):
            current_user.password = form.new_password.data
            current_user.modified = datetime.datetime.utcnow()
            current_user.save()
            current_app.logger.info('%s updated his / her password' % (current_user.email))
            flash('Neues Passwort gespeichert', 'success')
            return redirect('/')
        else:
            flash('Altes Passwort nicht korrekt', 'danger')
    return render_template('passwort.html', form=form)


@user.route('/recover', methods=['GET', 'POST'])
def recover():
    form = RecoverForm()
    if form.validate_on_submit():
        recover_user = User.objects(email=form.email.data.lower())
        if recover_user.count() == 0:
            flash('Diesen Account gibt es nicht.', 'danger')
        else:
            recover_user = recover_user.first()
            recover_user.send_recover_email()
            current_app.logger.info('%s sent an recovery request' % (form.email.data.lower()))
            return render_template('recover-mail-sent.html')
    return render_template('recover.html', form=form)


@user.route('/recover-check', methods=['GET', 'POST'])
def recover_check():
    serialized_data = request.args.get('id', '')
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        data = serializer.loads(
            serialized_data,
            salt=current_app.config['SECURITY_PASSWORD_SALT'],
            max_age=30 * 60 * 60 * 24 * 14
        )
    except:
        data = False
    if data == False:
        return render_template('recover-fail.html')
    else:
        print(data)
        if not len(data) == 2:
            return render_template('recover-fail.html')
        else:
            user = User.objects(id=data[0])
            if user.count() != 1:
                return render_template('recover-fail.html')
            else:
                user = user.first()
                if sha256(str.encode(user.password)).hexdigest() != data[1]:
                    return render_template('recover-fail.html')
                else:
                    form = RecoverSetForm()
                    if form.validate_on_submit():
                        user.password = form.password.data
                        user.active = True
                        user.modified = datetime.datetime.utcnow()
                        user.save()
                        login_user(user, remember=form.remember_me.data)
                        current_app.logger.info(
                            '%s got access to his / her account after registration / recovery' % (current_user.email))
                        flash('Passwort erfolgreich aktualisiert und erfolgreich eingeloggt.', 'success')
                        return redirect('/')
                    return render_template('recover-password-set.html', form=form, url_id=serialized_data)

@user.route('/account/settings', methods=['GET', 'POST'])
def account_settings():
    form = SettingsForm(request.form)
    if request.method == 'GET':
        form.subscription_frequency.data = current_user.subscription_frequency
        form.email_format.data = 'html' if current_user.html_emails else 'text'
    if form.validate_on_submit():
        current_user.subscription_frequency = form.subscription_frequency.data
        current_user.html_emails = form.email_format.data == 'html'
        current_user.save()
        flash('Einstellungen erfolgreich gespeichert!', 'success')
        return redirect('/')
    return render_template('settings.html', form=form)