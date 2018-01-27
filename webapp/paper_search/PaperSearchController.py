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
from ..extensions import db, es, csrf, cache
from ..common.response import json_response
from ..models import Body, Option

from .PaperSearchForms import SearchSubscribeForm
paper_search = Blueprint('paper_search', __name__, template_folder='templates')


@paper_search.route('/ratsdokumente/suche')
def document_search_main():
    bodies = Body.objects.order_by('name').all()
    form = SearchSubscribeForm()
    regions = Option.objects(key='region_cache').first()
    return render_template('paper-search.html', bodies=bodies, regions=regions.value, form=form)

@paper_search.route('/ratsdokumente/karte')
def document_search_map():
    bodies = Body.objects.order_by('name').all()
    form = SearchSubscribeForm()
    regions = Option.objects(key='region_cache').first()
    return render_template('paper-geo.html', bodies=bodies, regions=regions.value, form=form)

@paper_search.route('/api/search', methods=['POST'])
@csrf.exempt
def document_search_api():
    search_string = request.form.get('q', '')
    order_by = request.form.get('o', 'random')
    fq = json.loads(request.form.get('fq', '{}'))
    start = request.form.get('f', 0, type=int)
    size = request.form.get('s', 10, type=int)
    date = json.loads(request.form.get('date', '{}'))
    random_seed = request.form.get('rs', False)

    if order_by not in ['random', '_score', 'name.sort:asc', 'name.sort:desc', 'created:asc', 'created:desc']:
        abort(403)
    if start < 0:
        abort(403)
    if not random_seed and order_by == 'random':
        abort(403)


    query_parts_must = []

    if 'body' in fq:
        query_parts_must.append({
            'terms': {
                'body': fq['body']
            }
        })


    if 'region' in fq:
        query_parts_must.append({
            'term': {
                'region': fq['region']
            }
        })
    
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

    if 'location' in fq:
        query_parts_must.append({
            'term': {
                'location': fq['location']
            }
        })
    if 'paperType' in fq:
        query_parts_must.append({
            'terms': {
                'paperType': fq['paperType']
            }
        })
    if date:
        date_filter = {}
        if 'min' in date:
            if date['min']:
                date_filter['gte'] = date['min'] + 'T00:00:00'
        if 'max' in date:
            if date['max']:
                date_filter['lt'] = date['max'] + 'T00:00:00'
        if len(date_filter.keys()):
            query_parts_must.append({
                'range': {
                    'created': date_filter
                }
            })


    query_parts_should = []
    query_parts_should += generate_fulltext_query_parts(
        search_string, [
            ['name', 50],
            ['reference', 45],
            ['keyword', 40]
        ]
    )
    query_parts_should += generate_fulltext_query_parts(
        search_string, [
            ['name', 40],
            ['keyword', 35],
            ['text', 30]
        ],
        'mainFile'
    )
    query_parts_should += generate_fulltext_query_parts(
        search_string, [
            ['name', 35],
            ['keyword', 30],
            ['text', 25]
        ],
        'auxiliaryFile'
    )

    query_parts_must += [{
        'bool': {
            'should': query_parts_should
        }
    }]

    query = {
        'query': {
            'bool': {
                'must': query_parts_must
            }
        }
    }
    if order_by == 'random':
        query = {
            'query': {
                'function_score': {
                    'query': query['query'],
                    'random_score': {
                        'seed': random_seed
                    }
                }
            }
        }
        order_by = '_score'

    result_raw = es.search(
        index='paper-latest',
        doc_type='paper',
        body=query,
        size=size,
        from_=start,
        sort=order_by
    )
    result_raw_aggs = es.search(
        index='paper-latest',
        doc_type='paper',
        body={
            'aggs': {
                'paperType': {
                    'terms': {
                        'field': 'paperType',
                        'missing': 'keine Angabe',
                        'size': 1024
                    }
                },
                'body': {
                    'terms': {
                        'field': 'body',
                        'size': 1024
                    }
                }
            }
        },
        size=0
    )
    result = []
    for item in result_raw['hits']['hits']:
        result.append(item['_source'])

    result = {
        'data': result,
        'count': result_raw['hits']['total'],
        'status': 0,
        'aggs': {
            'paperType': result_raw_aggs['aggregations']['paperType']['buckets'],
            'body': result_raw_aggs['aggregations']['body']['buckets']
        }
    }

    return json_response(result)


def generate_fulltext_query_parts(search_string, fulltext_boost_fields, nested=False):
    # Falls Query String vorhanden: Suche in den einzelnen Feldern, Boosting je nach Feld
    query_parts_fulltext = []
    if search_string:
        for fulltext_boost_field in fulltext_boost_fields:
            query_parts_fulltext.append(
                {
                    'query_string': {
                        'fields': [(str(nested) + '.' if nested else '') + fulltext_boost_field[0]],
                        'query': search_string,
                        'default_operator': 'and',
                        'boost': fulltext_boost_field[1]
                    }
                }
            )
        if nested:
            query_parts_fulltext = [{
                'nested': {
                    'path': nested,
                    'query': {
                        'bool': {
                            'should': query_parts_fulltext
                        }
                    }
                }
            }]
    return query_parts_fulltext


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
            doc_type='region',
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
        result_raw = es.search(
            index='paper-location-latest',
            doc_type='location',
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
        doc_type='street',
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
