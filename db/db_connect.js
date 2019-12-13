
const mysql = require('mysql');

//创建数据库连接
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',  //账号
    password: '123456', //密码
    database: 'db_project', //数据库名
    dateStrings: true, //<-  强制日期类型(TIMESTAMP, DATETIME, DATE)以字符串返回
    multipleStatements: true // 支持执行多条 sql 语句
})
//Connect
db.connect((err) => {
    if(err) throw err;
    console.log("Mysql Connect...");
})

module.exports = db;


