//wikipedia
request = require('request'),
module.exports = class Utils {
    constructor(){
    }
    consult(keywords){
      return new Promise(function(resolve, reject) {
        // Setting URL and headers for request
        var api_url = "https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&page="+keywords;
        var options = {url: api_url, headers: {'User-Agent': 'request'}};

        // Do async job
        request.get(options, function(err, resp, body) {
          if (err) {
            reject(err);
          } else {
            let output = "";
            let markup = JSON.parse(body).parse.text["*"];
            let text = markup.replace(/(<([^>]+)>)/ig,"")
            output = text
            resolve(output);
          }
        })
       })
    }
}