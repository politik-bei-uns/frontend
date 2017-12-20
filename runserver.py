# encoding: utf-8

import os

from webapp import launch

app = launch()

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')
