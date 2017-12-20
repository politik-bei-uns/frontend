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

import json

from flask import (Flask, Blueprint, render_template, current_app, request, flash, redirect, abort)
from flask_login import login_required, login_user, current_user, logout_user, confirm_login, login_fresh
from ..storage import File, KeywordUsergenerated
from .FileShowForms import KeywordForm, FileReportForm
from ..extensions import mail
from flask_mail import Message


file_show = Blueprint('file_show', __name__, template_folder='templates')


@file_show.route('/file/<ObjectId:file_id>', methods=['GET', 'POST'])
def file_show_main(file_id):
    file = File.objects(id=file_id).first()
    if not file:
        abort(404)
    form = KeywordForm()
    if form.validate_on_submit():
        if not current_user.is_authenticated:
            abort(403)
        keyword = KeywordUsergenerated()
        keyword.keyword = form.keyword.data
        keyword.user = current_user.id

        # why the hell is THIS necessary?!
        keywords_usergenerated = []
        for keyword_usergenerated in file.keyword_usergenerated:
            keywords_usergenerated.append(keyword_usergenerated)
        keywords_usergenerated.append(keyword)
        file.keyword_usergenerated = keywords_usergenerated
        file.save()

        flash('Stichwort erfolgreich gespeichert!', 'success')
        return redirect('/file/%s' % file_id)
    return render_template('file-show.html', file=file, form=form)

@file_show.route('/file/<ObjectId:file_id>/report', methods=['GET', 'POST'])
def contact_form_report(file_id):
    file = File.objects(id=file_id).first()
    if not file:
        abort(404)
    form = FileReportForm()
    if form.validate_on_submit():
        reason = False
        for choice in form.reason.choices:
            if form.reason.data == choice[0]:
                reason = choice[1]
                break
        if not reason:
            abort(403)
        # TODO: E-Mail der Kommune integrieren (nach dem Testbetrieb)
        msg = Message(
            "Eine Datei wurde gemeldet",
            sender=current_app.config['MAILS_FROM'],
            recipients=current_app.config['ADMINS'],
            reply_to=form.email.data,
            body=render_template('emails/file-report.txt', name=form.name.data, email=form.email.data, details=form.details.data, reason=reason, file=file)
        )
        mail.send(msg)
        flash('Die Datei wurde erfolgreich gemeldet!', 'success')
        return redirect('/file/%s' % file_id)
    return render_template('file-report.html', form=form, file=file)
