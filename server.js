var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');

app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static('public'));






//Database configuration
mongoose.connect('mongodb://localhost/scraper');
var db = mongoose.connection;

db.on('error', function(err) {
    console.log('Mongoose Error: ', err);
});

db.once('open', function() {
    console.log('Mongoose connection successful.');
});

var Article = require('./models/Article.js');
var Note = require('./models/Note.js');



// Routes
app.get('/', function(req, res) {
    res.send(index.html);
});

//Site request
app.get('/scrape', function(req, res) {

    request('http://farlight.org/', function(error, response, html) {
        var $ = cheerio.load(html);
        $('p.title').each(function(i, element) {

            var result = {};

            result.title = $(this).children('a').text();
            result.link = $(this).children('a').attr('href');

            var entry = new Article(result);

            entry.save(function(err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(doc);
                }
            });
        });
    });
    res.send("Scrape Completed!");
});


app.get('/articles', function(req, res) {
    Article.find({}, function(err, doc) {
        if (err) {
            console.log(err);
        } else {
            res.json(doc);
        }
    });
});


app.get('/articles/:id', function(req, res) {

    Article.findOne({ '_id': req.params.id })

    .populate('note')
        .exec(function(err, doc) {
            if (err) {
                console.log(err);
            } else {
                res.json(doc);
            }

        });
});


app.post('/articles/:id', function(req, res) {
    var newNote = new Note(req.body);

    newNote.save(function(err, doc) {
        if (err) {
            console.log(err);
        } else {
            Article.findOneAndUpdate({ '_id': req.params.id }, { 'note': doc._id })
                .exec(function(err, doc) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.send(doc);
                    }
                });

        }
    });
});
var PORT = 3010
app.listen(PORT, function() {
    console.log('This app is running on port ' + PORT);
});

