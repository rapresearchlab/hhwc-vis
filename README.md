# hhwc-vis

This project contains several different html/js/D3 data visualizations based on the HHWC databases.  There are also server-side functions to fetch the necessary data from the databases.  This repo is set up as a minimal Flask app to explore the visualizations, but the visualization functions (and server-side helper functions) are meant to be able to be dropped into other front-ends.

## modules

- `get_from_db.py` contains server-side functions which, given a query word, get data from the database and return it as data structures which can be serialized and turned into JSON (which, in turn, can be returned to the client in an AJAX call).

- `static/js/vis.js` contains the front-end visualization code (along with a small amount of style from `templates/index.html`).  There are three main functions, each made for a specific kind of data and with its own visualization style: `add_top_users`, `add_word_history` and `add_nns`.  Each one takes height and width as arguments, and the visualizations scale through a reasonable range of sizes (from `height ~= 100` to at least `height ~= 300px`).

- `templates/index.html` is a front-end for a simple demo of all the visualizations.

- `app.py` is a bare-bones Flask app for demo-ing the visualizations.  (See `Usage` section for details on how to run).

## Dependencies
```
pip install mysql-connector-python
pip install flask
pip install python-dotenv
```

## Usage
To run on server: `sudo python3 app.py <db_host> <db_user> <db_pass> <db_name>`
