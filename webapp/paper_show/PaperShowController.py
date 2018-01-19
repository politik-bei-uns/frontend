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
from ..models import Paper, KeywordUsergenerated
from .PaperShowForms import KeywordForm

paper_show = Blueprint('paper_show', __name__, template_folder='templates')


@paper_show.route('/paper/<ObjectId:document_id>', methods=['GET', 'POST'])
def document_show_main(document_id):
    paper = Paper.objects(id=document_id).first()
    if not paper:
        abort(404)
    generated_geojson = []
    for location in paper.location:
        if location.geojson:
            generated_geojson.append(location.geojson)
    generated_geojson = json.dumps({
        'type': 'FeatureCollection',
        'features': generated_geojson
    })
    form = KeywordForm()
    if form.validate_on_submit():
        if not current_user.is_authenticated:
            abort(403)
        keyword = KeywordUsergenerated()
        keyword.keyword = form.keyword.data
        keyword.user = current_user.id

        # why the hell is THIS necessary?!
        keywords_usergenerated = []
        for keyword_usergenerated in paper.keyword_usergenerated:
            keywords_usergenerated.append(keyword_usergenerated)
        keywords_usergenerated.append(keyword)
        paper.keyword_usergenerated = keywords_usergenerated
        paper.save()
        
        flash('Stichwort erfolgreich gespeichert!', 'success')
        return redirect('/paper/%s' % document_id)
    return render_template('paper-show.html', paper=paper, generated_geojson=generated_geojson, form=form)