var url_valid = require('url-valid')
	, fs = require('fs')
	, http = require('http')
  , BufferHelper = require('bufferhelper')
  , iconv = require('iconv-lite');

var config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
var urlPattern = /[\"\'](http:\/\/(.*?))[\"\']/g;
/*
var ss = '<a href=\'http://www.baidu.com?id=1212#hhh\'>';
var a = urlPattern.exec(ss);
console.log (a);
*/
var stack = [];
var   = {};
var encoding = {'utf-8':true,'gb2312':true,'iso-8859-1':true,'gbk':true};
var stream = fs.createWriteStream("result2.txt");
var count = 0;
function markUrl(url) {
  stream.write((++count) + " " + url +"\n");
}

function printInfo(res) {
  var memory = process.memoryUsage();
  console.log(res.statusCode + "remain: " + stack.length + " heapTotal: " + memory.heapTotal + " heapUsed: " + memory.heapUsed + " " + Math.round(memory.heapUsed/memory.heapTotal*100) + "%");
}

function get(url) {
  //console.log("fetch url: " + url);
  var req = http.get(url, function(res) {
    printInfo(res);
    var charset = 'utf-8';
    //console.log(res.headers);
    if (!res.headers['content-type']) {
      return;
    }
    else {
      //console.log(res.headers['content-type']);
      var content_type = res.headers['content-type'].toLowerCase();
      if (content_type.indexOf('text/html') === -1)
        return ;
      var arr = content_type.split(';');
      for (var i = arr.length; i--;) {
        var index, c;
        if (arr[i].indexOf('charset') !== -1 && (index = arr[i].indexOf('=')) > 0) {
          charset = arr[i].substr(index+1);
          //console.log('charset=' + charset);
          //console.log(encoding[charset]);
          if (encoding[charset])
            break;
          else
            return;
        }
      }
      
    }

    if (res.statusCode === 200) {
      //console.log('mark url: ' +url);
      markUrl(url);
    }

    var bufferhelper = new BufferHelper();
    res.on('data', function(chuck) {
      bufferhelper.concat(chuck);
    });
    res.on('end', function() {
      var buf = bufferhelper.toBuffer();
      var str = iconv.decode(buf, charset);
      var arr = [];
      while((arr = urlPattern.exec(str)) != null) {
        if (!arr[1].match('[\.png|\.gif|\.css|\.js|\.dtd]$') && !exist[arr[1]]) {
          //console.log('not exist');
          stack.push(arr[1]);
          exist[arr[1]] = true;
        }
      }
    });
  }).on('error', function(err, msg) {
    console.log('error');
    req.abort();
  });
  req.on('socket', function (socket) {
    socket.setTimeout(10000);  
    socket.on('timeout', function() {
        console.log('timeout');
    });
  });
}
stack.push('http://hk.yahoo.com/?p=us');

function check() {
  if (stack.length > 0)
    get(stack.shift());
  else
    console.log("stack is empty.");
  setTimeout(function() {
    check();
  }, 200);

}

check();