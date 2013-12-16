var url_valid = require('url-valid')
	, fs = require('fs')
	, http = require('http')
  , BufferHelper = require('bufferhelper')
  , iconv = require('iconv-lite')
  , redis = require('redis')
  , client = redis.createClient();

if (process.argv.length != 4) {
  console.log("Usage: node index.js seed-url file");
  process.exit(1);
}

client.on("error", function (err) {
  console.log(err);
});
client.flushall();

var urlPattern = /[\"\'](http:\/\/(.*?))[\"\']/g;
/*
var ss = '<a href=\'http://www.baidu.com?id=1212#hhh\'>';
var a = urlPattern.exec(ss);
console.log (a);
*/
var stack = [];
var exist = {};
var encoding = {'utf-8':true,'gb2312':true,'iso-8859-1':true,'gbk':true};
var stream = fs.createWriteStream(process.argv[3]);
var count = 0;
var num = 0;
var flag = 0;
function markUrl(url) {
  count++;
  stream.write(url +"\n");
}

function printInfo(res) {
  client.llen('stack', function (err, reply) {
    console.log('stack: ' + reply + " fetched: " + num + " successed: " + count);
  });
}


function get(url) {
  client.set(url, "true");
  num++;
  flag++;
  var req = http.get(url, function(res) {
    printInfo(res);
    var charset = 'utf-8';
    if (!res.headers['content-type']) {
      return;
    }
    else {
      var content_type = res.headers['content-type'].toLowerCase();
      if (content_type.indexOf('text/html') === -1)
        return ;
      var arr = content_type.split(';');
      for (var i = arr.length; i--;) {
        var index, c;
        if (arr[i].indexOf('charset') !== -1 && (index = arr[i].indexOf('=')) > 0) {
          charset = arr[i].substr(index+1);
          if (!encoding[charset])
            return;
        }
      }
      
    }

    if (res.statusCode === 200) {
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
        if (!arr[1].match('[\.png|\.gif|\.css|\.js|\.dtd]$')) {
          (function(url) {
            client.get(url, function (err, reply) {
              if (!reply) {
                client.rpush('stack', url);
              }
            });
            client.set(url, "true");
          })(arr[1]);
        }
      }
      flag--;
    });
  }).on('error', function(err, msg) {
    console.log('error');
    flag--;
    req.abort();
  });
  req.on('socket', function (socket) {
    socket.setTimeout(10000);  
    socket.on('timeout', function() {
      flag--;
      console.log('timeout');
    });
  });
}
//stack.push('http://www.baidu.com/');
client.rpush('stack', process.argv[2]);
//client.rpush('stack', 'http://www.hao123.com/');
//client.rpush('stack', 'http://www.amazon.com/');

function check() {
  client.lpop('stack', function (err, reply) {
    if (reply) {
      get(reply);
    } else {
      console.log('stack is empty');
    }
  });
  setTimeout(check, 100);
}

check();