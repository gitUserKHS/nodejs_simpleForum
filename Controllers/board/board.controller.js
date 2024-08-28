const express = require('express');
const dbConfig = require('../../lib/db');
const bodyParser = require('body-parser');
const util = require('util');

const app = express();

const conn = dbConfig.init();
//columns: id, writer_name, password, title, content, wdate, is_encrypted
//connect to mysql
dbConfig.connect(conn);
// allow to use async/await
const query = util.promisify(conn.query).bind(conn);

app.set('views', '../../views');
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}));

function getCurrentDate(date) {
    var year = date.getFullYear().toString();
    var month = date.getMonth() + 1;
    month = month < 10 ? '0' + month.toString() : month.toString();
    var day = date.getDate();
    day = day < 10 ? '0' + day.toString() : day.toString();
    var hour = date.getHours();
    hour = hour < 10 ? '0' + hour.toString() : hour.toString();
    var minites = date.getMinutes();
    minites = minites < 10 ? '0' + minites.toString() : minites.toString();
    var seconds = date.getSeconds();
    seconds = seconds < 10 ? '0' + seconds.toString() : seconds.toString();

    return year + month + day + hour + minites + seconds;
}

exports.showList = (req, res) => {
    var sql = 'SELECT ID, WRITER_NAME, TITLE, WDATE, IS_ENCRYPTED, PASSWORD FROM BOARD';  
    conn.query(sql, function (err, rows, fields) {
        if(err) console.log('query is not excuted. select fail...\n' + err);
        else {
            res.render('list.ejs', {list : rows, getCurrentDate: getCurrentDate});
        }
    });

}

exports.writePost = (req, res) => {
    res.render('write.ejs');
}

exports.displayPost = (req, res) => {
    let {postID, date} = req.query;
    var sql = "SELECT * FROM BOARD WHERE ID = ? AND WDATE = STR_TO_DATE(?, '%Y%m%d%H%i%s')";
    let params = [parseInt(postID), date];
    console.log(typeof postID); //debug
    console.log(typeof date); //debug
    console.log(params); // debug
    conn.query(sql, params, function(err, row){
        if(err) console.log('query is not excuted. select fail in function displayPost...\n' + err);
        else {
            console.log(row); // debug
            res.render('post.ejs', {postData: row[0]});
        }
    });
}

exports.afterWritePost = async (req, res) => {
    var body = req.body;
    console.log(body); // debug
    let currentDate = getCurrentDate(new Date());

    var sql = "INSERT INTO BOARD VALUES(?, ?, ?, ?, ?, STR_TO_DATE(?, '%Y%m%d%H%i%s'), ?)";
    var getIDSql = "SELECT ID FROM BOARD WHERE WDATE = STR_TO_DATE(?, '%Y%m%d%H%i%s') ORDER BY ID DESC";
    let IDcols = await query(getIDSql, [currentDate]).catch(err => console.log('query is not excuted. select id fail...\n' + err));
    let number = 1;
    if(IDcols.length > 0)
        number = IDcols[0].ID + 1;
    else number = 1;
    
    let passwd = 0;
    let is_encrypted = body.is_encrypted === 'true'?true:false;
    if(is_encrypted) passwd = body.password;
    let params = [number, body.id, passwd, body.title, body.content, currentDate, is_encrypted];
    console.log(sql); // debug
    console.log(params); // debug

    conn.query(sql, params, function(err) {
        if(err) console.log('query is not excuted. insert fail...\n' + err);
        else res.redirect('/board');
    });
}

exports.deletePost = async (req, res) => {
    var sql1 = "SELECT PASSWORD, IS_ENCRYPTED FROM BOARD WHERE ID = ? AND WDATE = STR_TO_DATE(?, '%Y%m%d%H%i%s')";
    var sql2 = "DELETE FROM BOARD WHERE ID = ? AND WDATE = STR_TO_DATE(?, '%Y%m%d%H%i%s')";
    let params = [];
    console.log('inandwdate: '); // debug
    console.log(req.body.idAndWdate); // debug
    let bodyObj = JSON.parse(req.body.idAndWdate);    

    console.log('req body: '); //debug
    console.log(bodyObj); // debug
    params.push(bodyObj.id, bodyObj.wdate);

    let pwCols = await query(sql1, params).catch(err => console.log('query is not excuted. select password and is_encrypted fail...\n' + err));

    if(!pwCols[0].IS_ENCRYPTED){
        conn.query(sql2, params, function(err){
            if(err) console.log('query is not excuted. delete fail...\n' + err);
            else res.redirect('/board');
        });
    }
    else{
        console.log('password is required');
        if(pwCols[0].PASSWORD == req.body.userPasswd){
            conn.query(sql2, params, function(err){
                if(err) console.log('query is not excuted. delete fail...\n' + err);
                else res.redirect('/board');
            });
        }
        else{
            try{
                res.send("<script>alert('정확한 비밀번호를 입력해주세요.');location.href='/board';</script>");
            }
            catch(exception){
                console.log('exception in func deletePost');
                res.redirect('/board');
            }
        }
    }
}

exports.moveToModifyPost = async (req, res) => {
    const sql = "SELECT PASSWORD, IS_ENCRYPTED, TITLE, CONTENT, ID, WDATE FROM BOARD WHERE ID = ? AND WDATE = STR_TO_DATE(?, '%Y%m%d%H%i%s')";

    const params = [];
    const bodyObj = JSON.parse(req.body.idAndWdate);    
    params.push(bodyObj.id, bodyObj.wdate);

    const cols = await query(sql, params).catch(err => console.log('query is not excuted. select password and is_encrypted fail...\n' + err));

    const move = () => {
        console.log("move to modify post!");
        const postInfo = {title: cols[0].TITLE, content: cols[0].CONTENT, id: cols[0].ID, wdate: cols[0].WDATE, getCurrentDate: getCurrentDate}
        res.render("modify.ejs", postInfo);
    }
    
    if(!cols[0].IS_ENCRYPTED){
        move();
    }
    else{
        // password required
        if(cols[0].PASSWORD == req.body.userPasswd){
            move();
        }
        else{
            try{
                res.send("<script>alert('정확한 비밀번호를 입력해주세요.');location.href='/board';</script>");
            }
            catch(exception){
                console.log('exception in func deletePost');
                res.redirect('/board');
            }
        }
    }
}

exports.modifyPost = (req, res) => {
    const sql = "UPDATE BOARD SET TITLE = ?, CONTENT = ? WHERE ID = ? AND WDATE = STR_TO_DATE(?, '%Y%m%d%H%i%s')";

    const idAndWdate = JSON.parse(req.body.idAndWdate);

    const title = req.body.title;
    const content = req.body.content;
    const id = idAndWdate.id;
    const wdate = idAndWdate.wdate;

    console.log(`modify: ${title}, ${content}, info: ${id}, ${wdate}`);

    conn.query(sql, [title, content, id, wdate], (err, row) => {
        if(err) console.log('query is not excuted. modify failed...\n' + err);
        else{
            console.log(row);
            res.redirect('/board');
        } 
    });
}