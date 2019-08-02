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
from datetime import datetime, timedelta
from flask import current_app, request
from ..extensions import es, csrf
from ..common.response import json_response
from .MeetingShowForms import MeetingSearchForm
from ..common.elastic_request import ElasticRequest

from .MeetingShowController import meeting_show


@meeting_show.route('/api/search/meeting', methods=['POST'])
@csrf.exempt
def document_search_api():
    form = MeetingSearchForm()
    if not form.validate():
        return json_response({
            'status': -1,
            'errors': form.errors
        })

    elastic_request = ElasticRequest(
        'meeting-latest',
        'meeting'
    )
    elastic_request.set_q_ext(
        form.text.data,
        [
            ['name', 50],
            ['keyword', 40]
        ]
    )
    elastic_request.set_q_ext(
        form.text.data,
        [
            ['name', 40],
            ['keyword', 35],
            ['text', 30]
        ],
        'invitation'
    )
    elastic_request.set_q_ext(
        form.text.data,
        [
            ['name', 35],
            ['keyword', 30],
            ['text', 25]
        ],
        'resultsProtocol'
    )
    elastic_request.set_q_ext(
        form.text.data,
        [
            ['name', 35],
            ['keyword', 30],
            ['text', 25]
        ],
        'verbatimProtocol'
    )
    elastic_request.set_q_ext(
        form.text.data,
        [
            ['name', 35],
            ['keyword', 30],
            ['text', 25]
        ],
        'auxiliaryFile'
    )
    if form.id.data:
        elastic_request.set_fq('id', form.id.data)
    if form.daterange.data:
        begin, end = form.daterange.data.split(' - ')
        begin = datetime.strptime(begin, '%d.%m.%Y')
        elastic_request.set_range_limit('start', 'gte', begin.strftime('%Y-%m-%d'))
        end = datetime.strptime(end, '%d.%m.%Y') + timedelta(days=1)
        elastic_request.set_range_limit('start', 'lt', end.strftime('%Y-%m-%d'))
    if form.region.data != 'root' and form.region.data:
        elastic_request.set_fq('region', form.region.data)
    if form.location.data:
        elastic_request.set_fq('location', form.location.data)
    if form.random_seed.data:
        elastic_request.set_random_seed(form.random_seed.data)

    items_per_page = current_app.config['ITEMS_PER_PAGE']
    elastic_request.set_skip((form.page.data - 1) * items_per_page)
    elastic_request.set_sort_field(form.sort_field.data)
    elastic_request.set_sort_order(form.sort_order.data)
    elastic_request.set_limit(items_per_page)

    elastic_request.set_agg('body')
    elastic_request.query()

    result = {
        'data': elastic_request.get_results(),
        'count': elastic_request.get_result_count(),
        'status': 0,
        'aggs': elastic_request.get_aggs(),
    }

    return json_response(result)
