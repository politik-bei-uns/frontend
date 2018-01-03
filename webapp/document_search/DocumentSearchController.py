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
from ..extensions import db, es, csrf
from ..common.response import json_response
from ..models import Body, Region
from .DocumentSearchForms import SearchSubscribeForm

document_search = Blueprint('document_search', __name__, template_folder='templates')


@document_search.route('/ratsdokumente')
def document_search_main():
    bodies = Body.objects.order_by('name').all()
    form = SearchSubscribeForm()

    regions = []
    for region_raw in Region.objects(parent__exists=False).all():
        regions.append({
            'id': str(region_raw.id),
            'name': region_raw.name,
            'rgs': region_raw.rgs,
            'level': region_raw.level,
            'children': region_get_children(region_raw.id)
        })
    return render_template('document-search.html', bodies=bodies, regions=regions, form=form)

def region_get_children(region_id):
    regions = []
    for region_raw in Region.objects(parent=region_id).all():
        region = {
            'id': str(region_raw.id),
            'name': region_raw.name,
            'rgs': region_raw.rgs,
            'level': region_raw.level,
            'body': []
        }
        for body in region_raw.body:
            region['body'].append(str(body.id))
        children = region_get_children(region_raw.id)
        if len(children):
            region['children'] = children
        regions.append(region)
    return regions


@document_search.route('/api/search', methods=['POST'])
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
        abort(500)

    query_parts_must = []
    if 'body' in fq:
        if fq['body'] != '_all':
            query_parts_must.append({
                'terms': {
                    'body': fq['body']
                }
            })

    if 'location' in fq:
        query_parts_must.append({
            'terms': {
                'location': fq['location']
            }
        })
    if 'paperType' in fq:
        if fq['paperType'] != '_all':
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


@document_search.route('/api/search/geo', methods=['POST'])
@csrf.exempt
def document_geo_search_api():
    search_string = request.form.get('q', '')
    zoom = request.form.get('z', 5, type=float)
    bounds = request.form.get('geo', False)
    if bounds:
        bounds = bounds.split(';')
        if len(bounds) != 4:
            bounds = False
        else:
            bounds = [
                [float(bounds[0]), float(bounds[1])],
                [float(bounds[2]), float(bounds[3])],
            ]
    #if zoom >= 6 and not bounds:
    #    abort(403)
    result = []
    if zoom < 11:
        if zoom < 6:
            level = 4
        elif zoom < 8:
            level = 6
        elif zoom < 11:
            level = 8

        result_raw = es.search(
            index='region-latest',
            doc_type='region',
            body={
                'query': {
                    'term': {
                        'level': level
                    }
                }
            },
            _source='geojson',
            size=10000
        )
        for item in result_raw['hits']['hits']:
            single = json.loads(item['_source']['geojson'])
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
        if zoom < 16:
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


@document_search.route('/api/search/street')
@csrf.exempt
def api_search_street():
    search_string = request.form.get('q', '')
    result_raw = es.search(
        index='paper-location-latest',
        doc_type='location',
        body={
            'query': {},
            'suggest': {
                'autocomplete': {
                    'text': search_string,
                    'completion': {
                        'field': 'autocomplete'
                    }
                }
            }
        },
        fields='autocomplete,geojson'
    )
    print(result_raw)
