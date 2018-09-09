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

from ..extensions import es

class ElasticRequest():

    def __init__(self, index, document):
        self.index = index
        self.document = document
        self.limit = 10
        self.skip = 0
        self.order_by = '_score'
        self.source = []
        self.random_seed = False

        self.aggs = {}
        self.query_parts_must = []
        self.query_parts_should = []
        self.query_parts_filter = []
        self.query_range = {}

        self.result_raw = False

    def set_q(self, search_string):
        self.query_parts_must.append({
            'query_string': {
                'query': search_string,
                'default_operator': 'and',
            }
        })

    def set_q_ext(self, search_string, fulltext_boost_fields, nested=False):
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
        if len(query_parts_fulltext):
            self.query_parts_should += query_parts_fulltext

    def set_fqs(self, data):
        for key, value in data.items():
            self.set_fq(key, value)

    def set_fq(self, key, value):
        if type(value) == list:
            self.query_parts_filter.append({
                'terms': {
                    key: value
                }
            })
        else:
            self.query_parts_filter.append({
                'term': {
                    key: value
                }
            })

    def set_rqs(self, data):
        for key, values in data.items():
            for operator, value in values.items():
                self.set_range_limit(key, operator, value)

    def set_range_limit(self, key, operator, value):
        if key not in self.query_range:
            self.query_range[key] = {}
        self.query_range[key][operator] = value

    def set_limit(self, limit):
        if limit < 0:
            return
        self.limit = limit

    def set_skip(self, skip):
        if skip < 0:
            return
        self.skip = skip

    def set_order_by(self, order_by):
        self.order_by = order_by

    def set_random_seed(self, random_seed):
        self.random_seed = random_seed

    def set_agg(self, agg, agg_type='terms'):
        self.aggs[agg] = {
            agg_type: {
                'field': agg,
                'missing': 'keine Angabe',
                'size': 1024
            }
        }

    def generate_query(self):
        for key, value in self.query_range.items():
            self.query_parts_filter.append({
                'range': {
                    key: value
                }
            })

        query = {
            'query': {
                'bool': {}
            }
        }
        if len(self.query_parts_must):
            query['query']['bool']['must'] = self.query_parts_must
        if len(self.query_parts_should):
            if not len(self.query_parts_must):
                query['query']['bool']['must'] = []
            query['query']['bool']['must'].append({
                'bool': {
                    'should': self.query_parts_should
                }
            })

        if len(self.query_parts_filter):
            query['query']['bool']['filter'] = self.query_parts_filter

        if self.order_by == 'random' and self.random_seed:
            query = {
                'query': {
                    'function_score': {
                        'query': query['query'],
                        'random_score': {
                            'seed': self.random_seed,
                        },
                        'boost_mode': 'sum'
                    }
                }
            }
            self.order_by = '_score'

        if self.aggs:
            query['aggs'] = self.aggs
        return query

    def query(self):
        query = self.generate_query()
        self.result_raw = es.search(
            index=self.index,
            doc_type=self.document,
            body=query,
            sort=self.order_by,
            _source=','.join(self.source),
            size=self.limit,
            from_=self.skip
        )

    def get_results(self):
        if not self.result_raw:
            return False
        result = []
        for item in self.result_raw['hits']['hits']:
            result.append(item['_source'])
        return result

    def get_result_count(self):
        if not self.result_raw:
            return False
        return self.result_raw['hits']['total']

    def get_aggs(self):
        result = {}
        for agg in self.aggs.keys():
            result[agg] = self.result_raw['aggregations'][agg]['buckets']
        return result
