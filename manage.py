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

from flask_script import Manager, Shell, Server
from flask import current_app
from webapp import launch
from webapp.extensions import db, cron as cron_run
import webapp.models as Models
from webapp.config import DefaultConfig
import os

app = launch()
manager = Manager(app)

@manager.shell
def make_shell_context():
    return dict(app=current_app, db=db, models=Models)

@manager.command
def initdb():
    # db.drop_all(bind=None)
    # db.create_all(bind=None)

    user = Models.User()
    user.user_name = 'a-ruge'
    user.password = 'passwort'
    user.type = 'admin'
    user.active = True

    db.session.add(user)
    db.session.commit()


@manager.command
def cron():
    cron_run.run()


"""
@manager.command
def celery_worker():
  celery_args = ['celery', 'worker', '-n', 'worker', '-C', '--autoscale=10,1', '--without-gossip']
  with app.app_context():
    return celery(celery_args)
"""

if __name__ == "__main__":
    manager.run()
