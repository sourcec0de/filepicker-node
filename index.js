// filepicker-node is a Node.js filepicker library

var request = require('request');

var BASE_URL="https://www.filepicker.io";
var endpoints = {};
endpoints.tempStorage = BASE_URL+"/api/path/storage/";

function Filepicker(apiKey) {
  this.apiKey = apiKey;
  return this;
}

Filepicker.prototype.read = function(url, options, callback){
  var req_options = {
    host: 'www.filepicker.io',
    port: 80,
    path: url.substring(BASE_URL.length),
    method: 'GET'
  }
  var req = http.request(req_options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      console.log('BODY: ' + chunk);
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  // write data to request body
  req.write('\n');
  req.end();
}

Filepicker.prototype.store = function(fileContents, options, callback, noencode){
  if(typeof options === "function") {
    noencode = !!callback;
    callback = options;
    options = {};
  } 
  else {
    noencode = !!noencode;
  }
  if(!options) {
    options = {};
  }
  if(!options.filename) {
    options.filename = '';
  }
  callback = callback || function(){};
  if(!fileContents) {
    callback(new Error('Error: no contents given'));
    return;
  }
  var returnData;
  fileContents = noencode ? fileContents : new Buffer(fileContents).toString('base64');
  request({
    method: 'POST',
    headers: {Accept: 'application/json'},
    url: endpoints.tempStorage + options.filename,
    form: {
      fileContents: fileContents,
      apikey: this.apiKey,
      persist: !!options.persist
    }
  }, function(err, res, body) {
    if(err) {
      callback(err);
      return;
    }
    var returnJson;
    try {
      returnJson = JSON.parse(body);
    } catch(e) {
      callback(new Error('Unknown response'), null, body);
      return;
    }

    if(returnJson.result == 'ok') {
      returnData = returnJson.data[0];
      callback(null, returnData.url, returnData.data);
    } else if(returnJson.result == 'error') {
      callback(new Error(returnJson.msg));
    } else {
      callback(new Error('Unknown response'), null, returnJson);
    }
  });
};

Filepicker.prototype.getUrlFromBuffer = function(buf, options, callback) {
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }
  if(!buf || !(buf instanceof Buffer)) {
    callback(new Error('Error: must use a Buffer'));
    return;
  }
  this.getUrlFromData(buf.toString('base64'), options, callback, true);
};

Filepicker.prototype.getUrlFromUrl = function(url, options, callback) {
  var self = this;
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }
  if(!url) {
    callback(new Error('Error: no url given'));
    return;
  }
  request({
    url:url,
    encoding:null
  },
  function(err, res, buf) {
    if(err || !buf) {
      callback(err);
      return;
    }
    self.getUrlFromBuffer(buf, options, callback, true);
  });
};

module.exports = Filepicker;
