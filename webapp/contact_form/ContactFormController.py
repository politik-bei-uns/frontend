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
from .ContactFormForms import ContactForm
from ..extensions import mail
from flask_mail import Message


contact_form = Blueprint('contact_form', __name__, template_folder='templates')


@contact_form.route('/contact', methods=['GET', 'POST'])
def contact_form_main():
    form = ContactForm()
    if form.validate_on_submit():
        msg = Message(
            "Eine Anfrage von %s" % form.name.data,
            sender=current_app.config['MAILS_FROM'],
            recipients=current_app.config['ADMINS'],
            reply_to=form.email.data,
            body=render_template('emails/contact-form.txt', name=form.name.data, email=form.email.data, message=form.message.data)
        )
        mail.send(msg)
        flash('Ihre Nachricht wurde erfolgreich gesendet!', 'success')
        return redirect('/contact')
    return render_template('contact-form.html', form=form)
