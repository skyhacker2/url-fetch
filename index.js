var url_valid = require('url-valid')
	, fs = require('fs')
	, http = require('http');

var config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
var urlPattern = /[\"\'](http:\/\/(.*?))[\"\']/g;
/*
var ss = '<a href=\'http://www.baidu.com?id=1212#hhh\'>';
var a = urlPattern.exec(ss);
console.log (a);
*/
var stack = [];
var stream = fs.createWriteStream("result.txt");
function markUrl(url) {
  stream.write(url +"\n");
}

function get(url) {
  console.log("fetch url: " + url);
  var req = http.get(url, function(res) {
    console.log(res.statusCode);
    if (res.statusCode === 200) {
      console.log('mark url: ' +url);
      markUrl(url);
    }
    var str = '';
    res.on('data', function(chunk) {
      str += chunk;
    });
    res.on('end', function() {
      var arr = [];
      while((arr = urlPattern.exec(str)) != null) {
        if (!arr[1].match('[\.png|\.gif|\.css|\.js|\.dtd]$'))
          stack.push(arr[1]);
      }
      if (stack.length > 0)
        get(stack.shift());
      else
        stream.end();
    });
  }).on('error', function(err, msg) {
    req.abort();
    if (stack.length > 0)
      get(stack.shift());
    else
      stream.end();
  });
}
get('http://blog.csdn.net/damon_king/article/details/2341450');