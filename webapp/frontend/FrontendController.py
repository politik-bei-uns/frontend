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

from flask import Blueprint, render_template
from ..models import Body


frontend = Blueprint('frontend', __name__, template_folder='templates')


@frontend.route('/')
def home():
    return render_template('home.html')


@frontend.route('/info/das-projekt')
def das_projekt():
    return render_template('das-projekt.html')


@frontend.route('/info/mitmachen')
def mitmachen():
    return render_template('mitmachen.html')


@frontend.route('/info/ueber-uns')
def ueber_uns():
    return render_template('ueber-uns.html')


@frontend.route('/info/hilfe')
def hilfe():
    return render_template('hilfe.html')


@frontend.route('/info/daten')
def daten():
    bodies = Body.objects.all()
    fields = ['legislative_term', 'organization', 'person', 'membership', 'meeting', 'agenda_item', 'consultation', 'paper', 'file', 'location' ]
    body_summary = {}
    for field in fields:
        body_summary[field] = 0

    for body in bodies:
        if body.statistics:
            for field in fields:
                body_summary[field] += body.statistics['objects'][field]
    all = 0
    for field in fields:
        all += body_summary[field]
    return render_template('daten.html', bodies=bodies, body_summary=body_summary, all=all)


@frontend.route('/info/schnittstelle')
def schnittstelle():
    return render_template('schnittstelle.html')


@frontend.route('/impressum')
def impressum():
    return render_template('impressum.html')


@frontend.route('/datenschutz')
def datenschutz():
    return render_template('datenschutz.html')


@frontend.route('/robots.txt')
def robots_txt():
    return render_template('robots.txt')
