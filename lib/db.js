
var mysql = require('mysql2');

var _host = 'localhost';
var _port = 3306;
var _user = 'root';
var _passwd = 'sqlHS';
var _db = 'boardDB';

var db_info = {
  host     : _host,
  port     : _port,
  user     : _user,
  password : _passwd,
  database : _db
};
 
module.exports = {
    init: function () {
        return mysql.createConnection(db_info);
    },
    connect: function(conn) {
        conn.connect(function(err) {
            if(err) console.error('mysql connection error : ' + err);
            else console.log('mysql is connected successfully!');
        });
    }
};
