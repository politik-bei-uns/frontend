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
from .PaperSearchForms import PaperSearchForm
from ..common.elastic_request import ElasticRequest

from .PaperSearchController import paper_search


@paper_search.route('/api/search/paper', methods=['POST'])
@csrf.exempt
def document_search_api():
    form = PaperSearchForm()
    if not form.validate():
        return json_response({
            'status': -1,
            'errors': form.errors
        })

    elastic_request = ElasticRequest(
        'paper-latest',
        'paper'
    )
    elastic_request.set_q_ext(
        form.text.data,
        [
            ['name', 50],
            ['reference', 45],
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
        'mainFile'
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
        elastic_request.set_range_limit('date', 'gte', begin.strftime('%Y-%m-%d'))
        end = datetime.strptime(end, '%d.%m.%Y') + timedelta(days=1)
        elastic_request.set_range_limit('date', 'lt', end.strftime('%Y-%m-%d'))
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
    elastic_request.set_agg('paperType')
    elastic_request.query()

    result = {
        'data': elastic_request.get_results(),
        'count': elastic_request.get_result_count(),
        'status': 0,
        'aggs': elastic_request.get_aggs(),
    }

    return json_response(result)


@paper_search.route('/api/search/geo', methods=['POST'])
@csrf.exempt
def document_geo_search_api():
    search_string = request.form.get('q', '')
    zoom = request.form.get('z', 5, type=float)
    bounds = request.form.get('geo', False)
    body_count = request.form.get('bc', -1, type=int)
    fq = json.loads(request.form.get('fq', '{}'))
    if bounds:
        bounds = bounds.split(';')
        if len(bounds) != 4:
            bounds = False
        else:
            bounds = [
                [float(bounds[0]), float(bounds[1])],
                [float(bounds[2]), float(bounds[3])],
            ]
    result = []
    if zoom < 11:
        if zoom < 6:
            level = 4
        elif zoom < 8:
            level = 6
        else:
            level = 8

        query = {
            'query': {
                'bool': {
                    'filter': [
                        {
                            'range': {
                                'level_min': {
                                    'lte': level,
                                }
                            }
                        },
                        {
                            'range': {
                                'level_max': {
                                    'gt': level,
                                }
                            }
                        },
                    ]
                }
            }
        }
        if body_count != -1:
            query['query']['bool']['filter'].append({
                'range': {
                    'body_count': {
                        'gte': body_count
                    }
                }
            })

        legacy = False
        if 'legacy' in fq:
            if int(fq['legacy']):
                legacy = True
        if not legacy:
            query['query']['bool']['filter'].append({
                'term': {
                    'legacy': False
                }
            })

        result_raw = es.search(
            index='region-latest',
            body=query,
            _source='geojson',
            size=10000
        )
        for item in result_raw['hits']['hits']:
            single = json.loads(item['_source']['geojson'])
            if 'properties' not in single:
                single['properties'] = {}
            single['properties']['id'] = item['_id']
            result.append(single)
    else:
        query = {
            'bool': {
                'filter': [
                    {
                        'exists': {
                            'field': 'geojson'
                        }
                    },
                    {
                        'geo_shape': {
                            'geosearch': {
                                'shape': {
                                    'type': 'envelope',
                                    'coordinates': bounds
                                },
                                "relation": "intersects"
                            }
                        }
                    }
                ]
            }
        }
        if zoom < 15:
            query['bool']['filter'].append({
                'term': {
                    'geotype': 'MultiLineString'
                }
            })

        legacy = False
        if 'legacy' in fq:
            if int(fq['legacy']):
                legacy = True
        if not legacy:
            query['bool']['filter'].append({
                'term': {
                    'legacy': False
                }
            })
        result_raw = es.search(
            index='paper-location-latest',
            body={
                'query': query
            },
            _source='geojson',
            size=10000
        )

        for item in result_raw['hits']['hits']:
            single = json.loads(item['_source']['geojson'])
            if 'properties' in single:
                single['properties']['id'] = item['_id']
                result.append(single)
    result = {
        'data': {
            'type': 'FeatureCollection',
            'features': result
        },
        'status': 0
    }
    return json_response(result)


@paper_search.route('/api/search/street', methods=['POST'])
@csrf.exempt
def api_search_street():
    search_string = request.form.get('q', '')
    fq = json.loads(request.form.get('fq', '{}'))
    query_parts_must = []

    legacy = False
    if 'legacy' in fq:
        if int(fq['legacy']):
            legacy = True
    if not legacy:
        query_parts_must.append({
            'term': {
                'legacy': False
            }
        })

    query_parts_must.append({
        "match": {
            "autocomplete": {
                "query": search_string,
                'operator': 'and'
            }
        }})
    result_raw = es.search(
        index='street-latest',
        body={
            'query': {
                'bool': {
                    'must': query_parts_must
                }
            },
        },
        _source='autocomplete,geojson',
        size=5
    )
    result = []
    for item_raw in result_raw['hits']['hits']:
        item = {
            'id': item_raw['_id']
        }
        if 'autocomplete' in item_raw['_source']:
            item['address'] = item_raw['_source']['autocomplete']
        if 'geojson' in item_raw['_source']:
            item['geojson'] = json.loads(item_raw['_source']['geojson'])
        result.append(item)
    result = {
        'data': result,
        'status': 0
    }
    return json_response(result)
