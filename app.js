const express = require('express');
const { engine } = require('express-handlebars');
const async = require("async");
const RSVP = require('rsvp');
const axios = require('axios');
const { fixUrls } = require('./helper')

require('dotenv').config();

const app = express();

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

// helper functions for v1
function fetchTitleV1(url, cb) {
    axios
        .get(url)
        .then(res => {
            const titleMatch = String(res.data).match(/<title[^>]*>([^<]+)<\/title>/);
            if (titleMatch && titleMatch.length)
                cb(titleMatch[1])
            else
                cb('NO RESPONSE')
        })
        .catch(error => {
            cb('NO RESPONSE')
        })
}

// helper functions for v2
function fetchTitleV2(url, cb) {
    axios
        .get(url)
        .then(res => {
            const titleMatch = String(res.data).match(/<title[^>]*>([^<]+)<\/title>/);
            if (titleMatch && titleMatch.length)
                cb(null, titleMatch[1])
            else
                cb(null, 'NO RESPONSE')
        })
        .catch(error => {
            cb(null, 'NO RESPONSE')
        })
}

// helper functions for v3
function fetchTitleV3(url) {
    return new RSVP.Promise(function (resolve, reject) {
        axios
            .get(url)
            .then(res => {
                const titleMatch = String(res.data).match(/<title[^>]*>([^<]+)<\/title>/);
                if (titleMatch && titleMatch.length)
                    resolve(titleMatch[1])
                else
                    resolve('NO RESPONSE')
            })
            .catch(error => {
                resolve('NO RESPONSE')
            })
    });
}

// v1 route
app.get('/v1/I/want/title/', (req, res) => {
    const { address } = req.query;
    if (!address)
        return res.render('home', {
            titles: [],
        });
    const urls = Array.isArray(address) ? address : [address];
    const fixedUrls = fixUrls(urls);
    const titles = [];
    for (let i = 0; i < fixedUrls.length; i++) {
        fetchTitleV1(fixedUrls[i], (title) => {
            titles.push(`${urls[i]} - "${title}"`);
            if (titles.length == fixedUrls.length) {
                res.render('home', {
                    titles: titles,
                });
            }
        })
    }
})

// v2 route
app.get('/v2/I/want/title/', (req, res) => {
    const { address } = req.query;
    if (!address)
        return res.render('home', {
            titles: [],
        });
    const urls = Array.isArray(address) ? address : [address];
    const fixedUrls = fixUrls(urls);
    async.parallel(fixedUrls.map((url) => (cb) => fetchTitleV2(url, cb)
    ), (err, titles) => {
        res.render('home', {
            titles: titles.map((title, i) => `${urls[i]} - "${title}"`),
        });
    })
})

// v3 route
app.get('/v3/I/want/title/', (req, res) => {
    const { address } = req.query;
    if (!address)
        return res.render('home', {
            titles: [],
        });
    const urls = Array.isArray(address) ? address : [address];
    const fixedUrls = fixUrls(urls);

    RSVP.all(fixedUrls.map((url) => fetchTitleV3(url))).then((titles) => {
        res.render('home', {
            titles: titles.map((title, i) => `${urls[i]} - "${title}"`),
        })
    })
})

app.get('*', function (req, res) {
    res.send('Not Found', 404);
});


app.listen(process.env.PORT, () => {
    console.log(`App listening on port ${process.env.PORT}`);
})