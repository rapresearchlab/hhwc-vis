#!/usr/bin/env python

import mysql.connector as mysql

import json

# CREATE TABLE `word_histogram` (
#     `word_year_id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
#     `wordid` INT(11),
#     `year` INT(5),
#     `count` INT(11))
# 
# CREATE TABLE `word_nearest_neighbors` (
#     `word_nn_id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
#     `wordid` INT(11),
#     `neighborid` INT(11),
#     `neighbor_rank` INT(11),
#     `distance` DOUBLE)

def nns(db_host, db_user, db_pass, db_name, limit=None):
    json_data = {}
    con = mysql.connect(host=db_host, user=db_user, passwd=db_pass,
            database=db_name)
    cur = con.cursor()
    query = 'SELECT wv1.word, wv2.word, nns.neighbor_rank, nns.distance from ' \
            'wordvec wv1, wordvec wv2, word_nearest_neighbors nns where ' \
            'wv1.id = nns.wordid and wv2.id = nns.neighborid'
    if limit is None:
        cur.execute(query)
    else:
        # couldn't use %s for this not sure why
        query += ' limit %s'
        cur.execute(query, (limit,))
    while True:
        res = cur.fetchone()
        if res is None:
            break
        word, neighbor, precedence, distance = res
        if word not in json_data:
            json_data[word] = []
        while len(json_data[word]) <= precedence:
            json_data[word].append(None)
        json_data[word][precedence] = {'neighbor': neighbor, 'distance': distance}
    return json_data


def nns_by_word(db_host, db_user, db_pass, db_name, query_word):
    json_data = []
    con = mysql.connect(host=db_host, user=db_user, passwd=db_pass,
            database=db_name)
    cur = con.cursor()
    query = 'SELECT wv2.word, nns.precedence, nns.neighbor_rank from wordvec ' \
            'wv1, wordvec wv2, word_nearest_neighbors nns where wv1.id = nns.wordid ' \
            'and wv2.id = nns.neighborid and wv1.word = %s'
    cur.execute(query, (query_word,))
    while True:
        res = cur.fetchone()
        if res is None:
            break
        neighbor, precedence, distance = res
        while len(json_data) <= precedence:
            json_data.append(None)
        json_data[precedence] = {'neighbor': neighbor, 'distance': distance}
    return json_data


def nn_coords_by_word(db_host, db_user, db_pass, db_name, query_word):
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
    query = 'SELECT wv_nn.word, wv_nn.tsne_x, wv_nn.tsne_y, wv_nn.tsne_z from wordvec ' \
            'wv_target, wordvec wv_nn, word_nearest_neighbors nns where ' \
            'wv_target.id = nns.wordid and wv_nn.id = nns.neighborid and ' \
            'wv_target.word = %s'
    cur.execute(query, (query_word,))
    json_data['neighbors'] = []
    while True:
        res = cur.fetchone()
        if res is None:
            break
        neighbor, x, y, z = res
        json_data['neighbors'].append({'word': neighbor, 'x': x, 'y': y, 'z': z})
    return json_data


def nn_coords_by_word_list(db_host, db_user, db_pass, db_name, words):
    json_data = []
    for word in words:
        json_data.append(
            nn_coords_by_word(db_host, db_user, db_pass, db_name, word));
    return json_data


def histos(db_host, db_user, db_pass, db_name, limit=None):
    # XXX this doesn't get data by artist, it just gets db lines,
    #  so it doesn't get full histogram for a given artist; hence
    #  somewhat useless
    json_data = []
    con = mysql.connect(host=db_host, user=db_user, passwd=db_pass,
            database=db_name)
    cur = con.cursor()
    query = 'SELECT wordvec.word, wh.year, wh.count from ' \
            'wordvec, word_histogram wh where wordvec.id = wh.wordid'
    if limit is None:
        cur.execute(query)
    else:
        query += ' limit %s'
        cur.execute(query, (limit,))
    while True:
        res = cur.fetchone()
        if res is None:
            break
        word, year, count = res
        for i in range(len(json_data)):
            if json_data[i]['word'] == word:
                datum['histo'].append({'year': year, 'count': count})
                break
            if i == len(json_data) - 1:
                # we're at the end so this histo is new
                json_data[i]['histo'] = []
    return json_data

def histo_by_word(db_host, db_user, db_pass, db_name, word):
    json_data = []
    con = mysql.connect(host=db_host, user=db_user, passwd=db_pass,
            database=db_name)
    cur = con.cursor()
    query = 'SELECT wh.year, wh.count from wordvec, word_histogram wh ' \
            'where wordvec.id = wh.wordid and wordvec.word = %s'
    cur.execute(query, (word,))
    while True:
        res = cur.fetchone()
        if res is None:
            break
        year, count = res
        json_data.append({'year': year, 'count': count})
    return json_data


def histo_by_some_words(db_host, db_user, db_pass, db_name, limit = None):
    json_data = []
    con = mysql.connect(host=db_host, user=db_user, passwd=db_pass,
            database=db_name)
    cur = con.cursor()
    query = 'SELECT word from wordvec'
    if limit is None:
        cur.execute(query)
    else:
        query += ' limit %s'
        cur.execute(query, (limit,))
    while True:
        res = cur.fetchone()
        if res is None:
            break
        word = res[0]
        print(word)
        json_datum = {'word': word, 'histo': histo_by_word(db_host, db_user,
            db_pass, db_name, word)}
        json_data.append(json_datum)
    con.close()
    return json_data


def histo_by_word_list(db_host, db_user, db_pass, db_name, words):
    json_data = []
    for word in words:
        json_data.append({'word': word, 'histo':
            histo_by_word(db_host, db_user, db_pass, db_name, word)});
    return json_data


def json_to_file(json_data, filename):
    with open(filename, 'w') as outfile:
        outfile.write(json.dumps(json_data))


def word_freqs(db_host, db_user, db_pass, db_name, limit = None):
    #TODO maybe sort json in descending order of most popular words (or at
    # least most popular in terms of top5)?
    json_data = []
    con = mysql.connect(host=db_host, user=db_user, passwd=db_pass,
            database=db_name)
    con2 = mysql.connect(host=db_host, user=db_user, passwd=db_pass,
            database=db_name)
    cur = con.cursor()
    query = 'SELECT word, top_user_1, top_user_2, top_user_3, top_user_4, ' \
            'top_user_5, top_user_1_count, top_user_2_count, top_user_3_count, ' \
            'top_user_4_count, top_user_5_count FROM wordvec'
    if limit is None:
        cur.execute(query)
    else:
        #XXX having the limit as %s didn't work for some reason
        query += ' LIMIT %s'
        cur.execute(query, (limit,))
    cur_artistID = con2.cursor() # separate cursor to keep results separate
    while True:
        res = cur.fetchone()
        if res is None:
            break
        word = res[0]
        word_data = {}
        word_data['word'] = word;
        word_data['freqs'] = []
        print(word)
        for i in range(1, len(res) - 5):
            artistID = res[i]
            if artistID is None:
                break
            cur_artistID.execute('SELECT artist FROM artist WHERE artistid=%s',
                    (artistID,))
            artist = cur_artistID.fetchone()[0]
            count = res[i + 5]
            print('    %s: %d' % (artist, count))
            word_data['freqs'].append({'artist': artist, 'count': count})
        json_data.append(word_data)
    con.close()
    con2.close()
    return json_data


def word_freqs_by_word(db_host, db_user, db_pass, db_name, word):
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
            cur.execute('SELECT artist FROM artist WHERE artistid=%s',
                    (artistID,))
            artist = cur.fetchone()[0]
            count = res[i + 5]
            print('    %s: %d' % (artist, count))
            json_data.append({'artist': artist, 'count': count})
    con.close()
    return json_data


def freqs_by_word_list(db_host, db_user, db_pass, db_name, words):
    json_data = []
    for word in words:
        json_data.append({'word': word, 'freqs':
            word_freqs_by_word(db_host, db_user, db_pass, db_name, word)});
    return json_data


# words that might have either interesting histo or interesting top artists
some_sample_words = ['jump', 'iphone', 'insta', 'snapchat', 'iraq', 'palestine',
        'drip', 'slatt', 'snoop', 'chronic', 'insta', 'snapchat', 'jiggy', 'cadillac',
        'basedgod', 'yeezy', 'love', 'death', 'compton', 'rosecrans', 'east', 'west',
        'dance', 'rhyme', 'turntables', 'microphone']

if __name__=="__main__":
    db_host = 'localhost'
    db_user = 'njoliat'
    db_pass = 'apassword'
    db_name = 'rap_5'
    
    # histos_json = histo_by_some_words(db_host, db_user, db_pass, db_name, 50)
    # json_to_file(histos_json, 'some_histos.json')

    # nns_json = nns(db_host, db_user, db_pass, db_name, 50)
    # json_to_file(nns_json, 'some_nns.json')

    # word_freqs_json = word_freqs(db_host, db_user, db_pass, db_name, 50)
    # json_to_file(word_freqs_json, 'some_word_freqs.json')

    sample_word_freqs = freqs_by_word_list(db_host, db_user, db_pass, db_name,
            some_sample_words)
    json_to_file(sample_word_freqs, 'good_freqs.json')

    sample_histos = histo_by_word_list(db_host, db_user, db_pass, db_name,
            some_sample_words)
    json_to_file(sample_histos, 'good_histos.json')
