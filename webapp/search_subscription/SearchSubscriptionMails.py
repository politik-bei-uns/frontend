# encoding: utf-8

"""
Copyright (c) 2012 - 2016, Ernesto Ruge
All rights reserved.
Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
"""

import datetime
from dateutil.parser import parse as datetime_parse
from dateutil.relativedelta import relativedelta
from flask import (render_template, current_app)
from ..extensions import cron, mail
from ..models import SearchSubscription, Option
from ..common.elastic_request import ElasticRequest
from flask_mail import Message


class SearchSubscriptionMails():
    def __init__(self):
        pass

    @staticmethod
    def cron():
        cron.register_task(SearchSubscriptionMails, 'send')

    def send(self):
        today = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        last_sync_option = Option.objects(key='search_subscription_cron_last_run').first()
        if last_sync_option:
            last_sync = datetime_parse(last_sync_option.value)
            if last_sync >= today:
                return
        for search_subscription in SearchSubscription.objects():
            self.send_subscription(search_subscription)
        if not last_sync_option:
            last_sync_option = Option()
            last_sync_option.key = 'search_subscription_cron_last_run'
        last_sync_option.value = today.isoformat()
        last_sync_option.save()

    def send_subscription(self, search_subscription):
        today = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        if search_subscription.user.subscription_frequency == 'month' and today.day != 1:
            return

        if search_subscription.user.subscription_frequency == 'week' and today.weekday() != 0:
            return

        if search_subscription.user.subscription_frequency == 'month':
            start = today - relativedelta(months=1)
        elif search_subscription.user.subscription_frequency == 'week':
            start = today - relativedelta(days=7)
        else:
            start = today - datetime.timedelta(days=2)

        elastic_request = ElasticRequest(
            'paper-latest',
            'paper'
        )

        if search_subscription.search_string:
            elastic_request.set_q_ext(
                search_subscription.search_string,
                [
                    ['name', 50],
                    ['reference', 45],
                    ['keyword', 40]
                ]
            )
            elastic_request.set_q_ext(
                search_subscription.search_string, [
                    ['name', 40],
                    ['keyword', 35],
                    ['text', 30]
                ],
                'mainFile'
            )
            elastic_request.set_q_ext(
                search_subscription.search_string, [
                    ['name', 35],
                    ['keyword', 30],
                    ['text', 25]
                ],
                'auxiliaryFile'
            )
        if search_subscription.paperType:
            if len(search_subscription.paperType):
                elastic_request.set_fq(search_subscription.paperType, search_subscription.paperType)

        if search_subscription.location:
            elastic_request.set_fq('location', str(search_subscription.location.id))

        if search_subscription.region:
            elastic_request.set_fq('region', str(search_subscription.region.id))

        elastic_request.set_range_limit('modified', 'gt', start.isoformat())

        elastic_request.set_limit(100)
        elastic_request.set_sort_field('modified')
        elastic_request.query()
        result = elastic_request.get_results()
        if not len(result):
            return

        message = Message(
            sender=current_app.config['MAILS_FROM'],
            recipients=[search_subscription.user.email],
            body=render_template('emails/search_subscription_digest.txt', search_subscription=search_subscription, result=result)
        )
        if search_subscription.user.subscription_frequency == 'week':
            message.subject = 'Politik bei uns: Ihre wöchentliche Übersicht'
        else:
            message.subject = 'Politik bei uns: Ihre tägliche Übersicht'

        if search_subscription.user.html_emails:
            message.html = render_template('emails/search_subscription_digest.html', search_subscription=search_subscription, result=result)

        mail.send(message)