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
from ..extensions import db, es, csrf
from ..common.response import json_response
from ..models import User, KeywordUsergenerated

admin = Blueprint('admin', __name__, template_folder='templates')

@admin.route('/admin')
@login_required
def admin_overview():
    if current_user.type != 'admin':
        abort(403)
    return render_template('dashboard.html')

@admin.route('/admin/keywords')
@login_required
def admin_keywords():
    if current_user.type != 'admin':
        abort(403)
    keywords = KeywordUsergenerated.objects.order_by('created', 'desc').all()
    return render_template('keywords.html', keywords=keywords)

@admin.route('/admin/users')
def document_search_main():
    if current_user.type != 'admin':
        abort(403)
    users = User.objects.order_by('email').all()
    return render_template('users.html', users=users)


