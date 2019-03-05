var express = require('express');
var uuid = require('uuid');

var app = express();
var id = uuid.v4();
var port = 3000;

app.get('/', function (req, res) {
  res.send('hellow nodejs - ' + id)
});

app.listen(port, function () {
  console.log('Example app listening on port: ' + port);
});