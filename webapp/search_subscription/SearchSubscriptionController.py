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
from dateutil import parser as dateutil_parser

from flask import (Flask, Blueprint, render_template, current_app, request, flash, redirect, abort)
from flask_login import login_required, login_user, current_user, logout_user, confirm_login, login_fresh

from ..models import SearchSubscription, Body, Location, Region
from ..common.response import json_response
from .SearchSubscriptionForms import SearchSubscribeDeleteForm

search_subscription = Blueprint('search_subscription', __name__, template_folder='templates')

@search_subscription.route('/account/search-subscriptions')
def search_subscription_main():
    search_subscriptions = SearchSubscription.objects(user=current_user.id).all()
    return render_template('search-subscriptions.html', search_subscriptions=search_subscriptions)

@search_subscription.route('/account/search-subscribe', methods=['POST'])
def search_subscription_subscribe():
    if not current_user.is_authenticated:
        flash('Um eine Suche speichern zu können, müssen Sie eingeloggt sein.', 'warning')
        return json_response({
            'result': 0,
            'redirect': '/login'
        })

    search_string = request.form.get('q', '')
    fq = json.loads(request.form.get('fq', '{}'))
    date = json.loads(request.form.get('date', '{}'))

    search_subscription = SearchSubscription()
    if search_string:
        search_subscription.search_string = search_string
    print(fq)
    if 'region' in fq:
        region = Region.objects(id=fq['region']).first()
        if region:
            search_subscription.region = region.id

    if 'location' in fq:
        location = Location.objects(id=fq['location']).first()
        if location:
            search_subscription.location = location.id

    if 'paperType' in fq:
        search_subscription.paperType = []
        for paper_type in fq['paperType']:
            search_subscription.paperType.append(paper_type)

    search_subscription.user = current_user.id

    search_subscription.save()

    flash('Suche erfolgreich gespeichert!', 'success')
    return json_response({
        'result': 0,
        'redirect': '/account/search-subscriptions'
    })

@search_subscription.route('/account/search-subscription/<search_subscription_id>/delete', methods=['GET', 'POST'])
def search_subscription_delete(search_subscription_id):
    search_subscription = SearchSubscription.objects(user=current_user.id).first()
    if not search_subscription:
        abort(404)
    form = SearchSubscribeDeleteForm()
    if form.validate_on_submit():
        search_subscription.delete()
        flash('Such-Abo erfolgreich gelöscht', 'success')
        return redirect('/account/search-subscriptions')
    return render_template('search-subscription-delete.html', search_subscription=search_subscription, form=form)