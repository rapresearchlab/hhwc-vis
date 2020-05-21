# hhwc-vis

This project contains several different Javascript/[D3js](https://d3js.org) data visualizations based on the HHWC databases.  There are also server-side Python functions to fetch the necessary data from the databases.  This repo is set up as a minimal Flask app to explore the visualizations, but the visualization functions (and server-side helper functions) are meant to be able to be integrated into other front ends.

## Modules

- `get_from_db.py` contains server-side functions which, given a query word or list of queries, get data from the database and return it as data structures which can be serialized and turned into JSON (which, in turn, can be returned to the client in an AJAX call).

- `static/js/vis.js` contains, along with a small amount of style from `templates/index.html`, the front-end visualization code.  There are three main functions, each made for a specific kind of data and with its own visualization style: `add_top_users`, a horizontal bar chart; `add_word_history`, a line chart; and `add_nns`, a 3D scatter plot.  Each one takes height and width as arguments, and looks reasonable through a range of sizes (from `height ~= 100` to at least `height ~= 300px`).

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
