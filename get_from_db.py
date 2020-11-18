#!/usr/bin/env python

import mysql.connector as mysql

import json

def nn_coords_by_word(db_host, db_user, db_pass, db_name, query_word, num_nns):
    '''Get nearest neighbor words of query_word from db, and the T-SNE
        coordinates of the neighbor words and query_word.  Return as
        a dict which can be serialized to JSON.

    params:
        db_host, db_user, db_pass, db_name: standard MySQL conn arguments
        query_word: word to find nearest neighbors of.
        num_nns: maximum number of neighbors to return

    returns:
        If query_word is in the DB, return JSONifiable dict in the following
        format:
            {
                query: {
                    word: string,
                    x: float,
                    y: float,
                    z: float
                },
                neighbors: [{
                    word: string,
                    x: float,
                    y: float,
                    z: float
                }]
            }
        Length of neighbors will be the minimum of 'num_nns' and the number
        of neighbors found in the DB (should be 10).

        If query_word is not in the DB, return empty dict {}.
    '''
    json_data = {}
    con = mysql.connect(host=db_host, user=db_user, passwd=db_pass,
            database=db_name)
    cur = con.cursor()
    query = 'SELECT tsne_x, tsne_y, tsne_z from wordvec where word = %s'
    cur.execute(query, (query_word,))
    res = cur.fetchone()
    if res is None:
        return {}
    else:
        target_x, target_y, target_z = res
    json_data['query'] = {'word': query_word, 'x': target_x, 'y': target_y,
            'z': target_z}
    # store the TSNE coords in the response.  ALSO, get the target coords
    query = 'SELECT wv_nn.word, wv_nn.tsne_x, wv_nn.tsne_y, wv_nn.tsne_z FROM ' \
            'wordvec wv_target, wordvec wv_nn, word_nearest_neighbors nns WHERE ' \
            'wv_target.wordvecid = nns.wordid and wv_nn.wordvecid = nns.neighborid and ' \
            'wv_target.word = %s ORDER BY nns.neighbor_rank'
    cur.execute(query, (query_word,))
    json_data['neighbors'] = []
    for i in range(num_nns):
        res = cur.fetchone()
        if res is None:
            break
        neighbor, x, y, z = res
        json_data['neighbors'].append({'word': neighbor, 'x': x, 'y': y, 'z': z})
    return json_data


def nn_coords_by_word_list(db_host, db_user, db_pass, db_name, words, num_nns):
    '''Calls nn_coords_by_word for each word in 'words' param.  Returns list of
        all results (serializable to JSON array).

    params:
        words: list of words of which to find nearest neighbors.
        all other params: passed to nn_coords_by_word; see that function's spec.

    returns:
        A JSONifiable list of return values of nn_coords_by_word, i.e.
            [{
                query: {
                    word: string
                    x: float
                    y: float
                    z: float
                },
                neighbors: [{
                    word: string
                    x: float
                    y: float
                    z: float
                }]
            }]
    '''
    json_data = []
    for word in words:
        json_data.append(
            nn_coords_by_word(db_host, db_user, db_pass, db_name, word, num_nns));
    return json_data



def history_by_word(db_host, db_user, db_pass, db_name, word):
    '''Get usage-count-over-time in rap lyrics for a given word, from the
        database.  Return a list which can be serialized to JSON.

    params:
        db_host, db_user, db_pass, db_name: standard MySQL conn arguments
        word: string; find usage-over-time for this word in DB.

    returns:
        If 'word' param is in the database, return list:
            [{year: int, count: int}]

        If 'word' is not in the DB, return empty list [].
    '''
    json_data = []
    con = mysql.connect(host=db_host, user=db_user, passwd=db_pass,
            database=db_name)
    cur = con.cursor()
    query = 'SELECT wh.year, wh.count from wordvec, word_histogram wh ' \
            'where wordvec.wordvecid = wh.wordid and wordvec.word = %s'
    cur.execute(query, (word,))
    while True:
        res = cur.fetchone()
        if res is None:
            break
        year, count = res
        json_data.append({'year': year, 'count': count})
    return json_data


def histories_by_word_list(db_host, db_user, db_pass, db_name, words):
    '''Calls history_by_words for each word in words list.

    params:
        db_host, db_user, db_pass, db_name: standard MySQL conn arguments
        words: [string].  List of words to run 'history_by_word' on.

    returns:
        List of query word and counts-by-year from history_by_word, which
        may be serialized to JSON:
            [{
                word: string,
                history: [{year: int, count: int}]
            }]
    '''
    json_data = []
    for word in words:
        json_data.append({'word': word, 'history':
            history_by_word(db_host, db_user, db_pass, db_name, word)});
    return json_data


def top_users_by_word(db_host, db_user, db_pass, db_name, word):
    '''Given a word, get from the DB the top five artists who have used that
        word the most, and the number of times each has used it.  Return as
        a list which can be serialized to JSON.

    params:
        db_host, db_user, db_pass, db_name: standard MySQL conn arguments.
        word: word of which to find top five users and their counts.

    returns:
        If 'word' is in the DB, return JSONifiable list in the following format:
            [{artist: string, count: int, numSongs: int}]

        If 'word is not in DB, return empty list [].
    '''
    json_data = []
    con = mysql.connect(host=db_host, user=db_user, passwd=db_pass,
            database=db_name)
    cur = con.cursor()
    query = 'SELECT top_user_1, top_user_2, top_user_3, top_user_4, ' \
            'top_user_5, top_user_1_count, top_user_2_count, top_user_3_count, ' \
            'top_user_4_count, top_user_5_count FROM wordvec WHERE word = %s'
    cur.execute(query, (word,))
    res = cur.fetchone()
    #XXX do we wanna like, clear the cursor here
    if res is not None:
        for i in range(len(res) - 5):
            artistID = res[i]
            cur.execute('SELECT artist.artist, count(song.songid) FROM song, artist ' \
                    'WHERE artist.artistid=%s and song.artistid = artist.artistid',
                    (artistID,))
            artist, numSongs = cur.fetchone()
            count = res[i + 5]
            print('    %s: %d' % (artist, count))
            json_data.append({'artist': artist, 'count': count, 'numSongs': numSongs})
    con.close()
    return json_data


def top_users_by_word_list(db_host, db_user, db_pass, db_name, words):
    '''Call top_users_by_word on every word in a list.

    params:
        db_host, db_user, db_pass, db_name: standard MySQL conn arguments.
        words: list of words to pass to top_users_by_word

    returns:
        List of query word and list of top-5 users from top_users_by_word,
            i.e.:
            [{
                word: string,
                top_users: [{artist: string, count: int}]
            }]
    '''
    json_data = []
    for word in words:
        json_data.append({'word': word, 'top_users':
            top_users_by_word(db_host, db_user, db_pass, db_name, word)});
    return json_data


def json_to_file(json_data, filename):
    with open(filename, 'w') as outfile:
        outfile.write(json.dumps(json_data))


# words that might have either interesting history or interesting top artists
some_sample_words = ['jump', 'iphone', 'insta', 'snapchat', 'iraq', 'palestine',
        'drip', 'slatt', 'snoop', 'chronic', 'insta', 'snapchat', 'jiggy', 'cadillac',
        'basedgod', 'yeezy', 'love', 'death', 'compton', 'rosecrans', 'east', 'west',
        'dance', 'rhyme', 'turntables', 'microphone']

if __name__=="__main__":
    db_host = 'localhost'
    db_user = 'njoliat'
    db_pass = 'apassword'
    db_name = 'rap_5'

    sample_nns = nn_coords_by_word_list(
            db_host, db_user, db_pass, db_name, some_sample_words, 10)
    json_to_file(sample_nns, 'sample_nns.json')
    
    sample_top_users = top_users_by_word_list(db_host, db_user, db_pass, db_name,
            some_sample_words)
    json_to_file(sample_top_users, 'sample_top_users.json')

    sample_histories = histories_by_word_list(db_host, db_user, db_pass, db_name,
            some_sample_words)
    json_to_file(sample_histories, 'sample_histories.json')
