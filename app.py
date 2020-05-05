import flask
from flask import Flask
from flask import request

import get_from_db
import json
import sys

app = Flask(__name__)

@app.route('/')
@app.route('/index')
def index():
    return flask.render_template('index.html')


@app.route('/word/<var>')
def some_view(var):
    return ('word = %s' % var)



@app.route('/_get_top5s')
def get_top5s():
    print('get_top5s')
    words_arg = request.args.get("words")
    words = [w.strip() for w in words_arg.split(',')]
    return json.dumps(get_from_db.freqs_by_word_list(
            app.config.get('db_host'), app.config.get('db_user'),
            app.config.get('db_pass'), app.config.get('db_name'), words))


@app.route('/_get_histos')
def get_histos():
    words_arg = request.args.get("words")
    words = [w.strip() for w in words_arg.split(',')]
    return json.dumps(get_from_db.histo_by_word_list(
            app.config.get('db_host'), app.config.get('db_user'),
            app.config.get('db_pass'), app.config.get('db_name'), words))


@app.route('/_get_neighbors')
def get_neighbors():
    words_arg = request.args.get("words")
    words = [w.strip() for w in words_arg.split(',')]
    return json.dumps(get_from_db.nn_coords_by_word_list(
            app.config.get('db_host'), app.config.get('db_user'),
            app.config.get('db_pass'), app.config.get('db_name'), words))


if __name__ == "__main__":
    app.config['db_host'] = sys.argv[1]
    app.config['db_user'] = sys.argv[2]
    app.config['db_pass'] = sys.argv[3]
    app.config['db_name'] = sys.argv[4]
    app.run(host="0.0.0.0", port=80)
