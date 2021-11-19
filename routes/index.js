var express = require('express');
var router = express.Router();
const crypto = require('crypto');
const mysql = require('mysql');
const https = require('https')
const session = require('express-session');
var bodyParser = require('body-parser');
const FormData = require("form-data");
const querystring = require('querystring');

/* GET users listing. */
router.get('/', function(req, res) {
  //res.render('index');
});

router.get('/login', function(req, res, next) {

  const geo = {
    hostname: 'www.googleapis.com',
    port: null,
    path: '/geolocation/v1/geolocate?key=AIzaSyC4OlhIK4CbIiiaOwbWJt1O61fkwK_df0I',
    method: 'POST',
    headers: {
      'Accept' : 'application/json',
      'Content-Type': 'application/json'
    }
  }

  const requg = https.request(geo, respg => {
    console.log(`statusCode: ${respg.statusCode}`)

    var resData = '';
    respg.on('data', function(chunk){
        resData += chunk;
    });


    respg.on('end', function(){
        req.session.geo = JSON.parse(resData)

        req.session.save(function(){
          console.log(req.session.geo);
        });
    });

  })

  requg.on('error', error => {
    console.error(error)
  })

  requg.end()
  /* let session = req.session;

  res.render('/login', {
  session : session
}); */

res.render('login')
});

router.post("/login", function(req, res, next){
  console.log(req.session);
  var email = req.body.email;
  var password = req.body.password;

  if (email && password) {
    const data = JSON.stringify({
      "user": {
        "email" : email,
        "password" : password
    }})

    const options = {
      hostname: 'newer_news_server.paas-ta.org',
      port: null,
      path: '/api/login',
      method: 'POST',
      headers: {
        'Accept' : 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }

    const requ = https.request(options, resp => {
      console.log(`statusCode: ${resp.statusCode}`)

      var statusCode = `${resp.statusCode}`;
      if(statusCode == "201" || statusCode == "200") {
        req.session.auth = resp.headers.authorization;
        console.log(req.session.auth)
        console.log(resp.headers.authorization)

        req.session.save(function(){
          console.log(req.session.geo);
          res.redirect("/feed")
        });

      } else {
        res.send('<script type="text/javascript">alert("Email 또는 Password가 일치하지 않습니다."); document.location.href="/login";</script>');
      }

      resp.on('data', d => {
        process.stdout.write(d)
      })
    })

    requ.on('error', error => {
      console.error(error)
    })

    requ.write(data)
    requ.end()

  } else {
    res.send('<script type="text/javascript">alert("email과 password를 입력하세요!"); document.location.href="/login";</script>');
    res.end();
  }

});

router.get('/logout', function(req, res) {
  req.session.destroy();

  res.redirect("/login")
});

router.get('/board', function(req, res) {

  const parameters = {
    gu : req.session.addr2,
  }

  const get_request_args = querystring.stringify(parameters);

  console.log(get_request_args);

  const options = {
    hostname: 'newer_news_server.paas-ta.org',
    port: null,
    path: '/api/posts?'+ get_request_args,
    method: 'GET',
    headers: {
      'Accept' : 'application/json',
      'Content-Type': 'application/json',
      'Authorization': req.session.auth
    }
  }

  const requ = https.get(options, resp => {
    var statusCode = `${resp.statusCode}`;
    if(statusCode == "201" || statusCode == "200") {
      console.log(statusCode);
      // console.log(resp);

      var resData = '';
      resp.on('data', function(chunk){
          resData += chunk;
      });

      resp.on('end', function(){
          console.log("resData : " + resData);
          res.render('board', {title: 'BOARD', rows: JSON.parse(resData), gu:req.session.addr2});
      });

      /*resp.on('data', d => {
        process.stdout.write(d)
      })*/


    } else {
      console.log(statusCode);
      res.render('board');
    }

  })

});

router.post('/board', function(req, res) {

  const data = JSON.stringify({
    "post": {
      "content" : req.body.content,
      "gu" : req.session.addr2
  }})

  const options = {
    hostname: 'newer_news_server.paas-ta.org',
    port: null,
    path: '/api/posts',
    method: 'POST',
    headers: {
      'Accept' : 'application/json',
      'Content-Type': 'application/json',
      'Authorization': req.session.auth
    }
  }

  console.log(req.body.content)
  //console.log(req.session)

  const requ = https.request(options, resp => {
    console.log(`statusCode: ${resp.statusCode}`)
    res.redirect("/board")

    resp.on('data', d => {
      process.stdout.write(d)
    })
  })

  requ.on('error', error => {
    console.error(error)
  })

  requ.write(data)
  requ.end()

});

router.get('/hotsearch', function(req, res) {

    console.log("hotsearch gu : "+ req.session.addr2);

    const parameters = {
      query : req.session.addr2,
      hot : true
    }

    const get_request_args = querystring.stringify(parameters);

    console.log(get_request_args);

    const options = {
      hostname: 'newer_news_server.paas-ta.org',
      port: null,
      path: '/api/issues?'+ get_request_args,
      method: 'GET',
      headers:  {
        'Accept' : 'application/json',
        'Content-Type': 'application/json',
        'Authorization': req.session.auth
      }
    }

    const requ = https.get(options, resp => {
      var statusCode = `${resp.statusCode}`;
      if(statusCode == "201" || statusCode == "200") {
        console.log("statusCode : "+statusCode);
        // console.log(resp);

        var resData = '';
        resp.on('data', function(chunk){
            resData += chunk;
        });

        resp.on('end', function(){
            console.log("resData : " + resData);

            const guoptions = {
              hostname: 'newer_news_server.paas-ta.org',
              port: null,
              path: '/api/gus',
              method: 'GET',
              headers:  {
                'Accept' : 'application/json',
                'Content-Type': 'application/json',
                'Authorization': req.session.auth
              }
            }

            const gurequ = https.get(guoptions, guresp => {
              var statusCode = `${guresp.statusCode}`;
              if(statusCode == "201" || statusCode == "200") {
                console.log("statusCode : "+statusCode);
                // console.log(resp);

                var guresData = '';
                guresp.on('data', function(chunk){
                    guresData += chunk;
                });

                guresp.on('end', function(){
                    console.log("resData : " + guresData);
                    res.render('hotsearch', {title: 'HOTSEARCH', rows: JSON.parse(resData), gus: JSON.parse(guresData), addr:req.session.addr2});
                });

            }
          });
            //res.render('hotsearch', {title: 'HOTSEARCH', rows: JSON.parse(resData), addr:req.session.addr2});
        });

        /*resp.on('data', d => {
          process.stdout.write(d)
        })*/


      } else {
        resp.on('data', function(chunk){
          console.log(JSON.parse(chunk));
        });
        // res.render('feed');
      }

    })
});

router.get('/feed', function(req, res) {

  // https://maps.googleapis.com/maps/api/geocode/json?latlng=37.566535,126.977969&language=ko&key=API_KEY
  // /maps/api/geocode/json?latlng='+req.session.geo.location.lat+','+req.session.geo.location.lng+'&language=ko&key=AIzaSyC4OlhIK4CbIiiaOwbWJt1O61fkwK_df0I
  const geo_option = {
    hostname: 'maps.googleapis.com',
    port: null,
    path: '/maps/api/geocode/json?latlng='+req.session.geo.location.lat+','+req.session.geo.location.lng+'&language=ko&key=AIzaSyC4OlhIK4CbIiiaOwbWJt1O61fkwK_df0I',
    method: 'POST',
    headers: {
      'Accept' : 'application/json',
      'Content-Type': 'application/json'
    }
  }

  const requgo = https.request(geo_option, respgo => {
    console.log(`statusCode: ${respgo.statusCode}`)

    var resData = '';
    respgo.on('data', function(chunk){
        resData += chunk;
    });

    respgo.on('end', function(){
        address = JSON.parse(resData)

        console.log("주소 : "+address.results[0].formatted_address)
        addr = address.results[0].formatted_address;

        var array = addr.split(" ");

        //출력
        for(var i=0;i<array.length;i++) {
          console.log(array[i]);
        }

        req.session.addr1 = array[1];
        req.session.addr2 = array[2];
        req.session.addr3 = array[3];

        req.session.save(function() {
          console.log(req.session.addr1);
          console.log(req.session.addr2);
          console.log(req.session.addr3);

          console.log("쿼리문 : "+req.session.addr3);

          const parameters = {
            query : req.session.addr3
          }

          const get_request_args = querystring.stringify(parameters);

          console.log(get_request_args);

          const options = {
            hostname: 'newer_news_server.paas-ta.org',
            port: null,
            path: '/api/issues?'+ get_request_args,
            method: 'GET',
            headers:  {
              'Accept' : 'application/json',
              'Content-Type': 'application/json',
              'Authorization': req.session.auth
            }
          }

          const requ = https.get(options, resp => {
            var statusCode = `${resp.statusCode}`;
            if(statusCode == "201" || statusCode == "200") {
              console.log("statusCode : "+statusCode);
              // console.log(resp);

              var resData = '';
              resp.on('data', function(chunk){
                  resData += chunk;
              });

              resp.on('end', function(){
                  console.log("resData : " + resData);
                  res.render('feed', {title: 'FEED', rows: JSON.parse(resData), addr:req.session.addr3, addr1:req.session.addr1, addr2:req.session.addr2, addr3:req.session.addr3});
              });

              /*resp.on('data', d => {
                process.stdout.write(d)
              })*/


            } else {
              resp.on('data', function(chunk){
                console.log(JSON.parse(chunk));
              });
              // res.render('feed');
            }

          })

        });

    });

  })

  requgo.on('error', error => {
    console.error(error)
  })

  requgo.end()

});

router.get('/feed/gu', function(req, res) {

  console.log("gu : "+ req.session.addr2);

  const parameters = {
    query : req.session.addr2
  }

  const get_request_args = querystring.stringify(parameters);

  console.log(get_request_args);

  const options = {
    hostname: 'newer_news_server.paas-ta.org',
    port: null,
    path: '/api/issues?'+ get_request_args,
    method: 'GET',
    headers:  {
      'Accept' : 'application/json',
      'Content-Type': 'application/json',
      'Authorization': req.session.auth
    }
  }

  const requ = https.get(options, resp => {
    var statusCode = `${resp.statusCode}`;
    if(statusCode == "201" || statusCode == "200") {
      console.log("statusCode : "+statusCode);
      // console.log(resp);

      var resData = '';
      resp.on('data', function(chunk){
          resData += chunk;
      });

      resp.on('end', function(){
          console.log("resData : " + resData);
          res.render('feed', {title: 'FEED', rows: JSON.parse(resData), addr:req.session.addr2, addr1:req.session.addr1, addr2:req.session.addr2, addr3:req.session.addr3});
      });

      /*resp.on('data', d => {
        process.stdout.write(d)
      })*/


    } else {
      resp.on('data', function(chunk){
        console.log(JSON.parse(chunk));
      });
      // res.render('feed');
    }

  })

});

router.get('/feed/si', function(req, res) {

  console.log("si : "+ req.session.addr1);

  const parameters = {
    query : req.session.addr1
  }

  const get_request_args = querystring.stringify(parameters);

  console.log(get_request_args);

  const options = {
    hostname: 'newer_news_server.paas-ta.org',
    port: null,
    path: '/api/issues?'+ get_request_args,
    method: 'GET',
    headers:  {
      'Accept' : 'application/json',
      'Content-Type': 'application/json',
      'Authorization': req.session.auth
    }
  }

  const requ = https.get(options, resp => {
    var statusCode = `${resp.statusCode}`;
    if(statusCode == "201" || statusCode == "200") {
      console.log("statusCode : "+statusCode);
      // console.log(resp);

      var resData = '';
      resp.on('data', function(chunk){
          resData += chunk;
      });

      resp.on('end', function(){
          console.log("resData : " + resData);
          res.render('feed', {title: 'FEED', rows: JSON.parse(resData),  addr:req.session.addr1, addr1:req.session.addr1, addr2:req.session.addr2, addr3:req.session.addr3});
      });

      /*resp.on('data', d => {
        process.stdout.write(d)
      })*/


    } else {
      resp.on('data', function(chunk){
        console.log(JSON.parse(chunk));
      });
      // res.render('feed');
    }

  })

});

router.get('/ilike', function(req, res) {

  const parameters = {
    kind : 'scrap'
  }

  const get_request_args = querystring.stringify(parameters);

  console.log(get_request_args);

  const options = {
    hostname: 'newer_news_server.paas-ta.org',
    port: null,
    path: '/api/issues/user_issue_lists?'+ get_request_args,
    method: 'GET',
    headers:  {
      'Accept' : 'application/json',
      'Content-Type': 'application/json',
      'Authorization': req.session.auth
    }
  }

  const requ = https.get(options, resp => {
    var statusCode = `${resp.statusCode}`;
    if(statusCode == "201" || statusCode == "200") {
      console.log("statusCode : "+statusCode);
      // console.log(resp);

      var resData = '';
      resp.on('data', function(chunk){
          resData += chunk;
      });

      resp.on('end', function(){
          console.log("resData : " + resData);
          res.render('likelists', {title: 'FEED', rows: JSON.parse(resData), addr:req.session.addr1});
      });

      /*resp.on('data', d => {
        process.stdout.write(d)
      })*/


    } else {
      resp.on('data', function(chunk){
        console.log(JSON.parse(chunk));
      });
      // res.render('feed');
    }

  })

});

router.get('/ihate', function(req, res) {

  const parameters = {
    kind : 'black_list'
  }

  const get_request_args = querystring.stringify(parameters);

  console.log(get_request_args);

  const options = {
    hostname: 'newer_news_server.paas-ta.org',
    port: null,
    path: '/api/issues/user_issue_lists?'+ get_request_args,
    method: 'GET',
    headers:  {
      'Accept' : 'application/json',
      'Content-Type': 'application/json',
      'Authorization': req.session.auth
    }
  }

  const requ = https.get(options, resp => {
    var statusCode = `${resp.statusCode}`;
    if(statusCode == "201" || statusCode == "200") {
      console.log("statusCode : "+statusCode);
      // console.log(resp);

      var resData = '';
      resp.on('data', function(chunk){
          resData += chunk;
      });

      resp.on('end', function(){
          console.log("resData : " + resData);
          res.render('hatelists', {title: 'FEED', rows: JSON.parse(resData), addr:req.session.addr1});
      });

      /*resp.on('data', d => {
        process.stdout.write(d)
      })*/


    } else {
      resp.on('data', function(chunk){
        console.log(JSON.parse(chunk));
      });
      // res.render('feed');
    }

  })

});

router.get('/feed/:id', function(req, res) {

  console.log(req.params.id);

  const parameters = {
    flag : 'true',
    kind : 'scrap'
  }

  const get_request_args = querystring.stringify(parameters);

  console.log(get_request_args);

  const options = {
    hostname: 'newer_news_server.paas-ta.org',
    port: null,
    path: '/api/issues/'+req.params.id+'/action?'+ get_request_args,
    method: 'PUT',
    headers:  {
      'Accept' : 'application/json',
      'Content-Type': 'application/json',
      'Authorization': req.session.auth
    }
  }

  console.log(JSON.stringify(options));

  const requ = https.request(options, resp => {
    var statusCode = `${resp.statusCode}`;
    if(statusCode == "201" || statusCode == "200") {
      console.log("statusCode : "+statusCode);
      // console.log(resp);

      var resData = '';
      resp.on('data', function(chunk){
          resData += chunk;
      });

      resp.on('end', function(){
          console.log("resData : " + resData);
          //res.render('feed');
      });

    } else {
      resp.on('data', function(chunk){
        console.log("Error : "+chunk);
      });
      //res.render('feed');
    }

  })

  requ.end()

});

router.get('/feed/:id/delete', function(req, res) {

  console.log(req.params.id);

  const parameters = {
    flag : 'true',
    kind : 'black_list'
  }

  const get_request_args = querystring.stringify(parameters);

  console.log(get_request_args);

  const options = {
    hostname: 'newer_news_server.paas-ta.org',
    port: null,
    path: '/api/issues/'+req.params.id+'/action?'+ get_request_args,
    method: 'PUT',
    headers:  {
      'Accept' : 'application/json',
      'Content-Type': 'application/json',
      'Authorization': req.session.auth
    }
  }

  console.log(JSON.stringify(options));

  const requ = https.request(options, resp => {
    var statusCode = `${resp.statusCode}`;
    if(statusCode == "201" || statusCode == "200") {
      console.log("statusCode : "+statusCode);
      // console.log(resp);

      var resData = '';
      resp.on('data', function(chunk){
          resData += chunk;
      });

      resp.on('end', function(){
          console.log("resData : " + resData);
          //res.render('feed');
      });

    } else {
      resp.on('data', function(chunk){
        console.log("Error : "+chunk);
      });
      //res.render('feed');
    }

  })

  res.write("<script>window.location=\"/feed\"</script>");
  requ.end()

});

router.get('/ihatecancel/:id', function(req, res) {

  console.log(req.params.id);

  const parameters = {
    flag : 'false',
    kind : 'black_list'
  }

  const get_request_args = querystring.stringify(parameters);

  console.log(get_request_args);

  const options = {
    hostname: 'newer_news_server.paas-ta.org',
    port: null,
    path: '/api/issues/'+req.params.id+'/action?'+ get_request_args,
    method: 'PUT',
    headers:  {
      'Accept' : 'application/json',
      'Content-Type': 'application/json',
      'Authorization': req.session.auth
    }
  }

  console.log(JSON.stringify(options));

  const requ = https.request(options, resp => {
    var statusCode = `${resp.statusCode}`;
    if(statusCode == "201" || statusCode == "200") {
      console.log("statusCode : "+statusCode);
      // console.log(resp);

      var resData = '';
      resp.on('data', function(chunk){
          resData += chunk;
      });

      resp.on('end', function(){
          console.log("resData : " + resData);
          //res.render('feed');
      });

    } else {
      resp.on('data', function(chunk){
        console.log("Error : "+chunk);
      });
      //res.render('feed');
    }

  })

  res.write("<script>window.location=\"/ihate\"</script>");
  requ.end()

});


router.get('/feed/:id/count', function(req, res) {

  const options = {
    hostname: 'newer_news_server.paas-ta.org',
    port: null,
    path: '/api/issues/'+req.params.id,
    method: 'GET',
    headers:  {
      'Accept' : 'application/json',
      'Content-Type': 'application/json',
      'Authorization': req.session.auth
    }
  }

  const requ = https.request(options, resp => {
      var statusCode = `${resp.statusCode}`;
      if(statusCode == "201" || statusCode == "200") {
        console.log("statusCode : "+statusCode);
        // console.log(resp);

        var resData = '';
        resp.on('data', function(chunk){
            resData += chunk;
        });

        resp.on('end', function(){
            console.log("resData : " + resData);
            //res.render('feed');
        });

      } else {
        resp.on('data', function(chunk){
          console.log("Error : "+chunk);
        });
        //res.render('feed');
      }

    })

    requ.end()

});

router.get('/join', function(req, res) {
  res.render('join');
});

router.post('/join', function(req, res) {

  console.log(req.body.email);

  const data = JSON.stringify({
    "user": {
      "email" : req.body.email,
      "password" : req.body.password,
      "username" : req.body.name
  }})

  const options = {
    hostname: 'newer_news_server.paas-ta.org',
    port: null,
    path: '/api/signup',
    method: 'POST',
    headers: {
      'Accept' : 'application/json',
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }

  const requ = https.request(options, resp => {
    console.log(`statusCode: ${resp.statusCode}`)
    res.redirect("/login")

    resp.on('data', d => {
      process.stdout.write(d)
    })
  })

  requ.on('error', error => {
    console.error(error)
  })

  requ.write(data)
  requ.end()

  /*
  const sql = "INSERT INTO users(name, password, email) VALUES(?,?,?)";

  client.query(sql,[req.body.name, req.body.password, req.body.email], function(err, result, fields) {
    if (err) throw err;
    console.log(result+"등록완료");
    res.redirect("/login")
  }); */

});

module.exports = router;
