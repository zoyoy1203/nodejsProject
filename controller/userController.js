var bodyParser = require('body-parser');
//对数据进行解析
var urlencodeParser = bodyParser.urlencoded({extended:false});
var express = require('express');
// 获取数据库连接
const db = require('../db/db_connect');

var router = express.Router();

// 文件上传
var multiparty = require('multiparty');


// 用户登录页面
router.route('/login')
    // get请求渲染登录页面
    .get(function (req,res) {
        if(req.cookies.islogin && req.cookies.userid){
            req.session.islogin=req.cookies.islogin;
            req.session.userid = req.cookies.userid;
        }
        if(req.session.islogin && req.session.userid){
            res.locals.islogin=req.session.islogin;
            res.locals.userid = req.session.userid;
            res.redirect('/index')  // 查询cookie，如果先前登陆过，cookie时间还没过期，则自动跳转页面，无需重新输入登录
        }else{
            res.render('login', {errinfo:''});// 如果没有cooike,则渲染登录页面
        }
      
    })
    // post请求查询用户信息
    .post(urlencodeParser,function(req,res){
        let params = [];
        params[0] = req.body.username;
        params[1] = req.body.password;
        // 查询指定用户名和密码的用户
        let sql = "SELECT * FROM `user` WHERE username=? AND `password`=?"; 
        db.query(sql, params, (err, result) => {
            if(err) throw err;
            // 查询到用户
            if(result[0] != null){
                // 保存登录信息到session和cookie
                // console.log(result[0].id)
                req.session.islogin=req.body.username;
                req.session.userid = result[0].id;
                res.locals.islogin=req.session.islogin;
                res.locals.userid = req.session.userid;
                res.cookie('islogin',res.locals.islogin,{maxAge:600000});  // cookies有效时间为10分钟
                res.cookie('userid',res.locals.userid,{maxAge:600000});
                res.redirect('/index')
            }else{  // 查询不到用户
                res.render('login',{errinfo:'无该用户！'});
            }
            
        })
    })

// 注销登录
// 退出登录页处理
router.get('/logout', function(req, res) {
    res.clearCookie('islogin');  // 清除cookie 和session
    res.clearCookie('userid');
    req.session.destroy();
    res.redirect('/user/login');  // 重定向到登录页面
  });

// 用户注册页面
router.route('/regis')
    // get请求渲染页面
    .get(function (req,res) {
        res.render('regis',{errinfo:''})
    })
    // post请求注册页面
    .post(urlencodeParser,function(req,res){
        let params = [];
        params[0] = req.body.username;
        params[1] = req.body.password;
        params[2] = req.body.nickname;
        let sql1 = "SELECT * FROM `user` WHERE username=?"; // 查询指定用户名的用户信息
        let sql2 = "INSERT INTO user(username,password,nickname) values(?,?,?)"; //向用户表插入用户信息
        db.query(sql1, params[0], (err, result) => {
            if(err) throw err;
            console.log(result)
            // 该用户名在数据库中查询到数据，则该用户已注册，显示错误信息
            if(result[0] !=null){
                res.render('regis',{errinfo:'该用户已注册！'})
            }else{ // 该用户名在数据库中查询不到，则该用户名未注册。 注册执行插入语句
                db.query(sql2,params,(err,result) => {
                    if(err) throw err;
                    // 注册成功跳转到登录页面
                    res.redirect('login');
                })
            }
        })

    })

// 个人中心页面
router.route('/home')
.get(function(req,res){
    if(req.cookies.islogin && req.cookies.userid){
        req.session.islogin=req.cookies.islogin;
        req.session.userid = req.cookies.userid;
    }
    if(req.session.islogin && req.session.userid){
        res.locals.islogin=req.session.islogin;
        res.locals.userid = req.session.userid;

        let sql = 'SELECT * from `user` WHERE id=?';  // 查询指定id的用户信息
        let sql1 = 'SELECT * from `news` WHERE user_id=?';// 查询指定用户id的用户动态
        var params = res.locals.userid;
        db.query(sql,params, (err, result) => {
            if (err) throw err;
            db.query(sql1,params,(err,result1) => {
                // console.log(result1)
                res.render('user',{username:res.locals.islogin,user:result[0],news:result1})
            })
          
        })
    }else{
        res.redirect('/user/login');
    }
   
})

// 用户上传修改头像
router.route('/updateAvatar')
    .post(function(req,res) {
        //获取表单的数据 以及post过来的图片
        var form = new multiparty.Form();
        form.uploadDir = 'upload/avatars';   //上传图片保存的地址     目录必须存在
        form.parse(req, function (err, fields, files) {
            //获取提交的数据以及图片上传成功返回的图片信息
            let params = [];
            params[0] = files.avatar[0].path;   // 上传图片路径
            params[1] = req.cookies.userid;    // 上传用户的id
            // console.log(params[1])
            var sql = 'UPDATE user SET avatar=? WHERE id = ?' //更新数据表中指定id的用户头像avatar
            db.query(sql, params, (err, result) => {
                if(err) throw err;
                res.redirect('/user/home');
            })
        });
    });

// 用户修改座右铭
router.route('/updateMotto')
    // post请求注册页面
    .post(urlencodeParser,function(req,res){
        let params = [];
        params[0] = req.body.motto;
        params[1] = req.cookies.userid;

        console.log(params[0])
        console.log(params[1])
        let sql = "UPDATE user SET motto=? WHERE id = ?"; // 修改指定id的用户的座右铭
        db.query(sql, params, (err, result) => {
            if(err) throw err;
            console.log('更新成功！')
            res.redirect('/user/home')
        })

    })




// 动态页面
router.route('/news')
    .get(function(req,res){
    
        if(req.cookies.islogin && req.cookies.userid){
            req.session.islogin=req.cookies.islogin;
            req.session.userid = req.cookies.userid;
        }
        if(req.session.islogin && req.session.userid){
            res.locals.islogin=req.session.islogin;
            res.locals.userid = req.session.userid;
            let params = [];
            params[0] = res.locals.userid;
            params[1] = res.locals.userid;
            params[2] = res.locals.userid;
            // sql语句：user,news多表联合查询,获取该用户好友得动态和自己的动态，并按发布时间排序
            let sql = 'SELECT news.*,`user`.avatar,`user`.nickname FROM `user`,news WHERE `user`.id=news.user_id AND user_id IN (SELECT fid FROM friend_connection WHERE uid = ?) OR (user_id=? AND `user`.id=?) ORDER BY news.createtime DESC,news.id DESC';
            // sql 语句：获取每条动态的用户点赞信息， 评论信息
            let sql1 = 'SELECT like_news.id,`user`.id "uid",`user`.avatar,`user`.nickname FROM `user`,like_news WHERE `user`.id=like_news.user_id AND like_news.news_id=?;SELECT `comment`.*,`user`.nickname FROM `comment`,`user` WHERE new_id=? AND `comment`.user_id=`user`.id'
            db.query(sql,params, (err, result) => {
                if (err) throw err;
                // console.log(result)
                if(result[0]!=null){
                    // console.log('---------')
                    for(let i=0;i<result.length;i++){ // 循环动态数据
                        // console.log(result[i].id)
                        let params = [];
                        params[0]=result[i].id;
                        params[1] = result[i].id;
                        var promise = new Promise(function (resolve, reject) {
                            db.query(sql1,params,(err,result1) => {  // 查询循环的每条动态的点赞信息
                                if (err) throw err;
                                resolve(result1)  // 将点赞信息传递出去
                            })
                        });
    
                        promise.then(function (value) {
                            var likeusers = value.slice(0)  // 获取到点赞信息，并拷贝一份给likeusers
                            result[i].like_users = likeusers[0]
                            result[i].like = 0;  // like 属性值 表示当前登录的用户是否点赞过该条动态 默认为0
                             // 循环动态的点赞列表，如果存在当前登录用户的信息，则将likes设为1，以便在页面上显示点赞和取消点赞按钮
                            for(let j=0;j<likeusers[0].length;j++){
                                if(likeusers[0][j].uid == res.locals.userid){
                                    result[i].like = 1;
                                    break;
                                }
                            }

                            // 添加评论
                            result[i].comments = likeusers[1];
                            // console.log(result[i].comments)
                            // console.log('==============')
                            if(i==result.length-1){ // 动态循环处理到最后一个，就可以渲染页面了
                                // res.send(result)
                                res.render('news',{username:res.locals.islogin,news:result})
                            }
                            
                        })
                        promise.catch(function(value){
                            console.log('出错！')
                        })
                        
                    }
                   
                }else{
                    // console.log('没有动态')
                    res.render('news',{username:res.locals.islogin,news:null,info:"暂无动态！"})
                }
             
                // console.log(result)
               
            })
        }else{
            res.redirect('/user/login');
        }
       
    })

// 用户发布动态
router.route('/uploadNew')
    .post(function(req,res) {
        //获取表单的数据 以及post过来的图片
        var form = new multiparty.Form();
        form.uploadDir = 'upload/newsImg';   //上传图片保存的地址     目录必须存在
        form.parse(req, function (err, fields, files) {
            //获取提交的数据以及图片上传成功返回的图片信息
            console.log(fields);  // 获取表单的数据
            console.log(files);  // 图片上传成功返回的信息
            let params = [];
            params[0] = req.cookies.userid;  // 上传用户id
            params[1] = fields.text[0];      // 动态的文字
            params[2] = files.img[0].path;   // 上传图片路径
     
            var sql = 'INSERT INTO news(user_id,text,img) VALUES(?,?,?)'  // 先动态表插入动态信息

            db.query(sql, params, (err, result) => {
                if(err) throw err;
                res.redirect('/user/news');
            })
        });
    });

// 用户评论
router.route('/addcomments')
.post(urlencodeParser,function(req,res) {
    let params =[]
    params[0] = req.body.newid;
    params[1] = req.cookies.userid;
    params[2] = req.body.content;
    sql = 'INSERT INTO `comment`(new_id,user_id,content) VALUES(?,?,?) ' // 向评论表插入用户评论信息
    db.query(sql,params,(err,result)=> {
        if (err) throw err;
        res.redirect('/user/news');
    })
});


// 好友列表
router.route('/friends')
.get(function(req,res){
    if(req.cookies.islogin && req.cookies.userid){
        req.session.islogin=req.cookies.islogin;
        req.session.userid = req.cookies.userid;
    }
    if(req.session.islogin && req.session.userid){
        res.locals.islogin=req.session.islogin;
        res.locals.userid = req.session.userid;
        // 查询当前用户的好友
        let sql = 'SELECT * FROM `user` WHERE id IN (SELECT fid FROM friend_connection WHERE uid = ?)';
        db.query(sql,res.locals.userid, (err, result) => {
            if (err) throw err;
            res.render('friends',{username:res.locals.islogin,friends:result});
        })
    }else{
        res.redirect('/user/login');
    }
})

// 更多好友页面
router.route('/morefriends')
.get(function(req,res){
    if(req.cookies.islogin && req.cookies.userid){
        req.session.islogin=req.cookies.islogin;
        req.session.userid = req.cookies.userid;
    }
    if(req.session.islogin && req.session.userid){
        res.locals.islogin=req.session.islogin;
        res.locals.userid = req.session.userid;
        let params = [];
        params[0] = req.cookies.userid;
        params[1] = req.cookies.userid;
        // 查询当前用户的除了自己的未添加过的用户信息
        let sql = 'SELECT * FROM `user` WHERE id NOT IN (SELECT fid FROM friend_connection WHERE uid = ?) AND id <>?';
        db.query(sql,params, (err, result) => {
            if (err) throw err;
            res.render('morefriends',{username:res.locals.islogin,friends:result});
        })
    }else{
        res.redirect('/user/login');
    }
})

// 添加好友
router.route('/addfriend')
.post(urlencodeParser,function(req,res){
    let params = [];
    params[0] = req.cookies.userid;
    params[1] = req.body.id;
    // console.log(params[0])
    // console.log(params[1])
    // 先好友关系表中插入好友关系数据
    let sql = "INSERT INTO friend_connection(uid,fid) VALUES(?,?)";
    db.query(sql, params, (err, result) => {
        if(err) throw err;
        // console.log(result)
        res.redirect('/user/morefriends');
    })

})

// 删除好友
router.route('/removefriend')
.post(urlencodeParser,function(req,res){
    let params = [];
    params[0] = req.cookies.userid;
    params[1] = req.body.id;
    // console.log(params[0])
    // console.log(params[1])
    // 删除指定用户id和好友id得关系数据
    let sql = "DELETE FROM friend_connection WHERE uid=? AND fid=?";
    db.query(sql, params, (err, result) => {
        if(err) throw err;
        // console.log(result)
        res.redirect('/user/friends');
    })

})

// 动态点赞
router.route('/addlike')
.post(urlencodeParser,function(req,res){
    let params = [];
    params[0] = req.body.id;
    params[1] = req.cookies.userid;
    console.log(req.body.like)
    // 根据like值判断是执行点赞语句还是取消点赞语句
    if(req.body.like==1){
        var sql = "DELETE FROM like_news WHERE news_id=? AND user_id=?";
    }else if(req.body.like==0){
        var sql = "INSERT INTO like_news(news_id,user_id) VALUES(?,?)";
    }
    // console.log(params[0])
    // console.log(params[1])

    db.query(sql, params, (err, result) => {
        if(err) throw err;
        // console.log(result)
        res.redirect('/user/news');
    })

})



module.exports = router;
