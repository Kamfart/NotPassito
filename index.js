//use path module
const path = require('path');
//use express module
const express = require('express');
//use hbs view engine
const hbs = require('hbs');
//use bodyParser middleware
const bodyParser = require('body-parser');
//use mysql database
const mysql = require('mysql');
const app = express();
const cookieParser = require('cookie-parser')

var nbPasswd = 0;

//Create Connection
const conn = mysql.createConnection({
  host: 'sql2.freemysqlhosting.net',
  port: '3306',
  user: 'sql2310777',
  password: 'uY3*aU8%',
  database: 'sql2310777'
});

/* const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Biow@Re22w!',
  database: 'notpassito'
}); */

//mysql -u sql2310777 -p'uY3*aU8%' -h sql2.freemysqlhosting.net -P 3306 -D sql2310777


//connect to database
conn.connect((err) =>{
  if(err) throw err;
  console.log('Mysql Connected...');
});

//set views file
app.set('views',path.join(__dirname,'views'));
//set view engine
app.set('view engine', 'hbs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//set folder public as static folder for static file
app.use('/assets',express.static(__dirname + '/public'));
app.use(cookieParser());

//nbPasswd = getNumberPasswd();
//console.log(nbPasswd);

//route for homepage
app.get('/',(req, res) => {
  res.render('login_view',{
    //results: results
  });
});

//route for homepage
app.get('/user/:user_id/:table_name/show',(req, res) => {
  var userId = req.url.split("/")[2];
  var tableName = req.url.split("/")[3];
  let sql = "SELECT p.* FROM password AS p \
            JOIN tablepassword AS tp on p.passwd_id = tp.passwd_id \
            JOIN base AS b on b.base_tableid = tp.table_id \
            JOIN user AS u on u.user_id = b.base_userid \
            WHERE u.user_id = "+userId+" AND tp.table_name = '"+tableName+"'";
            console.log("Test SQL "+sql);
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    console.log(results);
    for (entry in results){
      complexity = computeComplexity(results[entry].passwd_value)
      results[entry].passwd_level = complexity
    }
    res.render('product_view',{
      results: results
    });
    //res.send(results);
  });
});

app.get('/user/:user_id/nbPass',(req, res) => {
  var userId = req.url.split("/")[2];
  //let data = {passwd_name: req.body.passwd_name, passwd_user: req.body.passwd_user, passwd_value: req.body.passwd_value};
  let sql = "select count(p.passwd_id) as nb_pass \
  from password as p \
  join tablepassword as tp on p.passwd_id = tp.passwd_id \
  join base as b on b.base_tableid = tp.table_id \
  join user as u on u.user_id = b.base_userid \
  WHERE u.user_id ="+userId;
  console.log("Test SQL "+sql);
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    console.log(results);
    res.send(results);
  });
});

app.get('/user/:user_id/nbTable',(req, res) => {
  var userId = req.url.split("/")[2];
  //let data = {passwd_name: req.body.passwd_name, passwd_user: req.body.passwd_user, passwd_value: req.body.passwd_value};
  let sql = "select count(distinct tp.table_id) as nb_table \
  from tablepassword as tp \
  join password as p on p.passwd_id = tp.passwd_id \
  join base as b on b.base_tableid = tp.table_id \
  join user as u on u.user_id = b.base_userid \
  WHERE u.user_id ="+userId;
  console.log("Test SQL "+sql);
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    console.log(results);
    console.log("Query : " + query);
    res.send(results);
  });
});

//route for insert data
app.post('/connect',(req, res) => {
  let data = {user_email: req.body.user_email, user_password: req.body.user_password};
  let sql = "SELECT * FROM user WHERE user_email='"+req.body.user_email+"' AND user_password='"+req.body.user_password+"'";
  let query = conn.query(sql, data,(err, results) => {
    if(err) throw err;
    else if (results.length == 0){
      console.log("NO");
    }
    else{
      var userId = results[0].user_id;
      let sql_tableUser = "SELECT DISTINCT tp.table_name FROM tablepassword AS tp \
      JOIN base AS b on b.base_tableid = tp.table_id \
      JOIN user AS u ON u.user_id = b.base_userid \
      WHERE u.user_id ="+userId;
      let query = conn.query(sql_tableUser, data,(err, results) => {
        for (entry in results){
          results[entry].user_id = userId;
        }
        console.log(results);
        /* res.render('product_view',{
          results: results
        }); */
        res.send(results);
      });
    }
  });
});

app.post('/registration',(req, res) => {
  let data = {user_firstname: req.body.user_firstname, user_lastname: req.body.user_lastname, user_email: req.body.user_email, user_password: req.body.user_password};
  let sql = "INSERT INTO user SET ?"
  console.log("Test SQL "+sql);
  let query = conn.query(sql, data,(err, results) => {
    if(err) throw err;
    res.redirect('/');
  });
});

//route for insert data
app.post('/user/:user_id/:table_name/save',(req, res) => {
  var userId = req.url.split("/")[2];
  var tableName = req.url.split("/")[3];
  var userUrlShow = "/" + req.url.split("/")[1] + "/" + req.url.split("/")[2] + "/" + req.url.split("/")[3]+ "/show";

  let data = {passwd_name: req.body.passwd_name, passwd_user: req.body.passwd_user, passwd_value: req.body.passwd_value};
  
  // 1) Insert dans password
  let sql = "INSERT INTO password SET ?";
  
  // 2) Récupérer l'id de la passwordtable et créé une jointure dans passwordtable entre password et passwordtable
  // let sql = "INSERT INTO tablepassword ";
  // select distinct tp.table_id FROM tablepassword as tp join base as b on b.base_tableid = tp.table_id join user as u on u.user_id = b.base_userid WHERE u.user_id = 1 and tp.table_name = 'network';
  
  // 3) Récupérer l'id de la base et créé une jointure dans la base entre user base et passwordtable
  
  /* let sql = "select count(passwd_id) as nb_passwd from password";
  console.log("SQL : "+sql);
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    console.log("Result :" + results);
    console.log("Query : " + query);
    return results;
  }); */
  console.log("Test SQL "+sql);
  let query = conn.query(sql, data,(err, results) => {
    if(err) throw err;
  });

  
});

//route for update data
app.post('/user/:user_id/:table_name/update',(req, res) => {
  var userId = req.url.split("/")[2];
  var tableName = req.url.split("/")[3];
  var userUrlShow = "/" + req.url.split("/")[1] + "/" + req.url.split("/")[2] + "/" + req.url.split("/")[3]+ "/show";

  let sql = "UPDATE password p \
  JOIN tablepassword tp on tp.passwd_id = p.passwd_id \
  JOIN base b on b.base_tableid = tp.table_id \
  JOIN user u on u.user_id = b.base_userid \
  SET passwd_name='"+req.body.passwd_name+"', \
  passwd_user='"+req.body.passwd_user+"', \
  passwd_value='"+req.body.passwd_value+"'\
  WHERE u.user_id = " + userId +" AND tp.table_name = '"+tableName+"';"

  console.log(sql);
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.redirect(userUrlShow);
  });
});

//route for delete data
app.post('/user/:user_id/:table_name/delete',(req, res) => {
  var userId = req.url.split("/")[2];
  var tableName = req.url.split("/")[3];
  var userUrlShow = "/" + req.url.split.split("/")[1] + "/" + req.url.split.split("/")[2] + "/" + req.url.split.split("/")[3]+ "/show";
  let sql = "DELETE FROM password WHERE passwd_id="+req.body.passwd_id;
  console.log("SQL : "+sql);
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.redirect(userUrlShow);
  });
});

//server listening
app.listen(8000, () => {
  console.log('Server is running at port 8000');
});

function getNumberPasswd(){
  let sql = "select count(passwd_id) as nb_passwd from password";
  console.log("SQL : "+sql);
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    console.log("Result :" + results);
    console.log("Query : " + query);
    return results;
  });
}

function computeComplexity(passwd){
  var nbLow = 0;
  var nbUpp = 0;
  var nbDig = 0;
  var nbSpec = 0;
  for (car in passwd){
    if (isLowerCase(passwd[car]))
      nbLow++;
    else if (isUpperCase(passwd[car]))
      nbUpp++;
    else if (!isNaN(passwd[car]))
      nbDig++;
    else
      nbSpec++;
  }
  complexity = anssiJudgment(nbLow, nbUpp, nbDig, nbSpec);
  return complexity;
}

function anssiJudgment(_nbLow, _nbUpp, _nbDig, _nbSpec){
  var length = _nbDig + _nbLow + _nbSpec + _nbUpp;
  if (length <= 9)
    return "baby"
  
  else if ( length > 9 
            && length <= 15 
            && _nbLow > 0
            && _nbUpp > 0 
            && _nbDig > 0 
            && _nbSpec > 0)
    return "child"
  
  else if ( length == 16 
            && _nbLow == 0
            && _nbUpp > 0 
            && _nbDig > 0 
            && _nbSpec == 0)
    return "genins"
  
  else if ( length == 16 
            && _nbLow > 0
            && _nbUpp > 0 
            && _nbDig > 0 
            && _nbSpec > 0)
    return "warrior"
  
  else if ( length > 16 
      && _nbLow > 0
      && _nbUpp > 0 
      && _nbDig > 0 
      && _nbSpec > 0)
    return "God"
  
  else
    return "child"
}

function countLowerCase(passwd){
  var nb = 0;
  for (car in passwd){
    if (isLowerCase(passwd[car]))
      nb++;
    else
      continue;
  }
  return nb;  
}

function countUpperCase(passwd){
  var nb = 0;
  //const isUpperCase = (string) => /^[A-Z]*$/.test(string)
  for (car in passwd){
    if (isUpperCase(passwd[car]))
      nb++;
    else
      continue;
  }
  return nb;  
}

function countDigit(passwd){
  var nb = 0;
  for (car in passwd){
    if (!isNaN(passwd[car]))
      nb++;
    else
      continue;
  }
  return nb;
}

function countSpecial(passwd){
  var nb = 0;
  for (car in passwd){
    if (!isLowerCase(passwd[car]) && !isUpperCase(passwd[car]) && !isNaN(passwd[car]))
      nb++;
    else
      continue;
  }
  return nb; 
}

function isUpperCase(str)
{
    return str != str.toLowerCase() && str == str.toUpperCase();
}

function isLowerCase(str)
{
    return str == str.toLowerCase() && str != str.toUpperCase();
}