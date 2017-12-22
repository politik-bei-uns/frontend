Das "Politik bei uns"-Frontend sorgt für die Bereitstellung der auf https://politik-bei-uns.de/ befindlichen Weboberfläche. Um die Oberfläche zu betreiben, werden die Daten in einer Form benötigt, wie sie vom "Politik bei uns"-Daemon mit aktiviertem Processing bereitgestellt werden.

Das Frontend basiert auf dem Python-Microframework Flask und stellt so eine WSGI-Applikation bereit. Folgende Komponenten werden benötigt:

* Ein Linux (getestet mit Ubuntu 16.04 und Debian 9.0)
* Python 3 (getestet mit Python 3.5)
* MongoDB 3 (getestet mit MongoDB 3.2 und 3.4)
* ElasticSearch 5 (getestet mit ElasticSearch 5.6)
* Minio
* Ein HTTP-Server (getestet mit Nginx)


Um den Daemon zu installieren, brauchen wir zunächst die Dateien

```bash
$ mkdir frontend
$ cd frontend
$ git clone https://github.com/politik-bei-uns/frontend.git .
```

Anschließend benötigen wir ein Virtual Environment und alle Pakete:
```bash
$ virtualenv -p python3 venv 
$ source venv/bin/activate
$ pip install -r requirements.txt
```

Des weiteren muss die Konfigurationsdatei erstellt werden:
```
$ cp webapp/config-dist.py webapp/config.py
$ vim webapp/config.py
```

Anschließend kann das "Politik bei uns"-Frontend testweise gestartet werden. Auf Port 5000 lauscht dann der Development-Server und stellt dort eine OParl-API bereit.
```
$ python runserver.py
```

Wenn man die SSH-Verbindung geschlossen hat, muss man immer erst wieder in das Virtual Enviroment zurück und kann dann wie gewohnt weiterarbeiten:
```
$ source venv/bin/activate
$ python manage.py
```


Um das "Politik bei uns"-Frontend dauerhaft zu verwenden, empfiehlt sich z.B. die Einrichtung von `gunicorn` als WSGI-Server und Nginx als Reverse Proxy. Dabei muss der Ordner `/static` direkt verfügbar gemacht werden, d.h. er darf nicht von Flask verarbeitet werden.

Außerdem braucht das "Politik bei uns"-Frontend natürlich Daten in der MongoDB, in Minio und in ElasticSearch, damit etwas vernünftiges ausgegeben werden kann. Diese können z.B. via "Politik bei uns"-Daemon dort eingefügt werden.