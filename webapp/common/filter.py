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

import pytz
import math
import datetime
from urllib.parse import quote_plus



def register_global_filters(app):
    @app.template_filter('datetime')
    def template_datetime(value, format='medium'):
        if value.tzname() == 'UTC':
            value = value.astimezone(pytz.timezone('Europe/Berlin'))
        if format == 'full':
            strftime_format = "%A, der %d.%m.%y um %H:%M Uhr"
        elif format == 'medium':
            strftime_format = "%d.%m.%y %H:%M"
        elif format == 'short':
            strftime_format = "%d.%m, %H:%M"
        elif format == 'fulldate':
            strftime_format = "%d.%m.%Y"
        value = value.strftime(strftime_format)
        return value

    @app.template_filter('price')
    def template_price(value):
        output = str(round(value, 2)).replace('.', ',')
        return output + ' €'

    @app.template_filter('filesize')
    def template_filesize(value):
        if value > 10000000:
            return str(int(value/1000000)) + ' MB'
        if value > 1000000:
            return str(round(value / 1000000, 1)).replace('.', ',') + ' MB'
        if value > 10000:
            return str(int(value/1000)) + ' kB'
        if value > 1000:
            return str(round(value / 1000, 1)).replace('.', ',') + ' kB'
        return value + ' Byte'

    @app.template_filter('timedelta')
    def template_timedelta(value, format='medium'):
        result = "%2d:%02d:%02d" % (
            math.floor(value / 1000 / 60 / 60),
            math.floor((value / 1000 / 60) % 60),
            math.floor((value / 1000) % 60)
        )
        if format == 'medium':
            result += ' ' + 'Stunden'
        return result

    @app.context_processor
    def primary_processor():
        def combine_datetime(datetime_from, datetime_till, link=' - ', format='medium'):
            if datetime_from.tzname() == 'UTC':
                datetime_from = datetime_from.astimezone(pytz.timezone('Europe/Berlin'))
            if datetime_till.tzname() == 'UTC':
                datetime_till = datetime_till.astimezone(pytz.timezone('Europe/Berlin'))

            if datetime_from.year == datetime_till.year and datetime_from.month == datetime_till.month and datetime_from.day == datetime_till.day:
                strftime_format_day = "%d.%m.%y"
                strftime_format_time = "%H:%M"
                return "%s, %s%s%s" % (
                datetime_from.strftime(strftime_format_day), datetime_from.strftime(strftime_format_time), link,
                datetime_till.strftime(strftime_format_time))
            else:
                return template_datetime(datetime_from, format) + link + template_datetime(datetime_till, format)

        return dict(combine_datetime=combine_datetime)

    @app.template_filter('urlencode')
    def urlencode(data):
        return (quote_plus(data))

    @app.template_filter('dottify')
    def dottify(value):
        if value:
            if value > 999:
                return str(value)[:-3] + '.' + str(value)[-3:]
        return value




