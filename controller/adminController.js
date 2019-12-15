var bodyParser = require('body-parser');
//对数据进行解析
var urlencodeParser = bodyParser.urlencoded({extended:false});
var express = require('express');
// 获取数据库连接
const db = require('../db/db_connect');

var router = express.Router();

// 文件上传
var multiparty = require('multiparty');

// 管理员登录页面
router.route('/adminlogin')
    // get请求渲染登录页面
    .get(function (req,res) {
        if(req.cookies.islogin && req.cookies.userid && req.cookies.islogin=='admin'){
            req.session.islogin=req.cookies.islogin;
            req.session.userid = req.cookies.userid;
        }
        if(req.session.islogin && req.session.userid){
            res.locals.islogin=req.session.islogin;
            res.locals.userid = req.session.userid;
            res.redirect('/admin/adminUser')  // 查询cookie，如果先前登陆过，cookie时间还没过期，则自动跳转页面，无需重新输入登录
        }else{
            res.render('adminLogin', {errinfo:''}); // 如果没有cooike,则渲染登录页面
        }
      
    })
    // post请求查询管理员信息是否正确
    .post(urlencodeParser,function(req,res){
        let params = [];
        params[0] = req.body.username;
        params[1] = req.body.password;
        let sql = "SELECT * FROM `user` WHERE username=? AND `password`=?";
        db.query(sql, params, (err, result) => {
            if(err) throw err;
            // 查询到用户
            if(result[0] != null && result[0].username=='admin'){
                // 保存登录信息到session和cookie
                // console.log(result[0].id)
                req.session.admin=req.body.username;
                req.session.adminid = result[0].id;
                res.locals.admin=req.session.admin;
                res.locals.adminid = req.session.adminid;
                res.cookie('admin',res.locals.admin,{maxAge:600000});
                res.cookie('adminid',res.locals.adminid,{maxAge:600000});
                res.redirect('/admin/adminUser')
            }else{  
                res.render('adminLogin',{errinfo:'该账号无效或不是管理员账号！'});
            }
            
        })
    })

// 注销登录
// 退出登录页处理
router.get('/logout', function(req, res) {
    res.clearCookie('admin');
    res.clearCookie('adminid');
    req.session.destroy();
    res.redirect('/admin/adminLogin');
  });

// 去往前台
router.get('/goIndex',function(req,res){
    if(req.cookies.admin && req.cookies.adminid){
        req.session.admin=req.cookies.admin;
        req.session.adminid = req.cookies.adminid;
    }
    if(req.session.admin && req.session.adminid){
        res.locals.admin=req.session.admin;
        res.locals.adminid = req.session.adminid;
        res.cookie('islogin',req.cookies.admin,{maxAge:600000});  // 设置cookie有效时间为10分钟
        res.cookie('userid',req.cookies.adminid,{maxAge:600000});
        res.redirect('/index');
    }else{
        res.redirect('/admin/adminlogin'); // 如果没有cooike,则跳转管理员登录页面
    }
})

// 用户管理页面
router.route('/adminUser')
 // get请求渲染登录页面
 .get(function (req,res) {
     // 如果有cooike,则渲染控制台页面
    if(req.cookies.admin && req.cookies.adminid){
        req.session.admin=req.cookies.admin;
        req.session.adminid = req.cookies.adminid;
    }
    if(req.session.admin && req.session.adminid){
        res.locals.admin=req.session.admin;
        res.locals.adminid = req.session.adminid;
      
        let sql = 'SELECT * FROM `user`'; // 查询所有用户
        db.query(sql, (err, result) => {
            if(err) throw err;
            res.render('adminUser',{admin:req.cookies.admin,users:result}); 
           
        })

    }else{
        res.redirect('/admin/adminlogin'); // 如果没有cooike,则跳转管理员登录页面
    }
  
})

// 删除用户
router.route('/deleteUser')
.post(urlencodeParser,function(req,res){
    let params =req.body.id;
    let sql = "DELETE FROM `user` WHERE id=?"; //删除指定id的用户
    db.query(sql, params, (err, result) => {
        if(err) throw err;
        console.log(result)
        res.redirect('/admin/adminUser');
    })
})



// 菜谱推荐页面
router.route('/adminFoodRec')
.get(function(req,res){
    if(req.cookies.admin && req.cookies.adminid){
        req.session.admin=req.cookies.admin;
        req.session.adminid = req.cookies.adminid;
    }
    if(req.session.admin && req.session.adminid){
        res.locals.admin=req.session.admin;
        res.locals.adminid = req.session.adminid;
        let sql = 'SELECT * FROM foods_detail LIMIT 0,8'   // 查询美食详情表前8条数据
        let sql1 = 'SELECT COUNT(*)as count FROM foods_detail' // 查询美食详情表的数据总量
        db.query(sql, (err, result) => {
            if(err) throw err;
            db.query(sql1,(err,result1)=> {
                if(err) throw err;
                let count = Math.ceil(result1[0].count/8);  // 8条数据一页，计算总共需要几页
                res.render('adminFoodRec',{admin:req.cookies.admin,foods:result,count:count,page:0}); 
            })
           
        })
    }else{
        res.redirect('/admin/adminlogin'); // 如果没有cooike,则跳转管理员登录页面
    }
})

// 菜谱推荐页面分页切换
router.route('/page')
.get(urlencodeParser,function(req,res){
    if(req.cookies.admin && req.cookies.adminid){
        req.session.admin=req.cookies.admin;
        req.session.adminid = req.cookies.adminid;
    }
    if(req.session.admin && req.session.adminid){
        res.locals.admin=req.session.admin;
        res.locals.adminid = req.session.adminid;
        let page = req.query.page;
        // console.log(page);
        let param = page*8;
        let sql = "SELECT * FROM foods_detail LIMIT ?,8";  //查询菜谱详情前8条数据
        let sql1 = 'SELECT COUNT(*)as count FROM foods_detail'  // 查询菜谱详情表数据总数
        db.query(sql, param, (err, result) => {
            if(err) throw err;
            // console.log(result)
            db.query(sql1,(err,result1)=> {
                if(err) throw err; 
                let count = Math.ceil(result1[0].count/8); // 计算菜谱详情表数据页数
                res.render('adminFoodRec',{admin:req.cookies.admin,foods:result,count:count,page:page}); 
            })
         
        })
    }else{
        res.redirect('/admin/adminlogin'); // 如果没有cooike,则跳转管理员登录页面
    }

   
})

// 菜谱推荐功能
router.route('/recommend')
.post(urlencodeParser,function(req,res){
    if(req.cookies.admin && req.cookies.adminid){
        req.session.admin=req.cookies.admin;
        req.session.adminid = req.cookies.adminid;
    }
    if(req.session.admin && req.session.adminid){
        res.locals.admin=req.session.admin;
        res.locals.adminid = req.session.adminid;
        let params = [];
        params[1] = req.body.id;
        let rec = req.body.rec;
        let page = req.body.page;
        if(rec==1){
            params[0]=0;
        }else{
            params[0]=1
        }
        var sql = "UPDATE foods_detail SET recommend=? WHERE id = ?"; // 更新指定菜谱id值的recommend推荐记录，1：推荐  0：不推荐

        // console.log(params[0])
        // console.log(params[1])
    
        db.query(sql, params, (err, result) => {
            if(err) throw err;
            // console.log(result)
            res.redirect('/admin/page?page='+page); //分页跳转
        })
    }else{
        res.redirect('/admin/adminlogin'); // 如果没有cooike,则跳转管理员登录页面
    }
})

// 菜谱添加页面
router.route('/adminFoodAdd')
    .get(function(req,res){
        if(req.cookies.admin && req.cookies.adminid){
            req.session.admin=req.cookies.admin;
            req.session.adminid = req.cookies.adminid;
        }
        if(req.session.admin && req.session.adminid){
            res.locals.admin=req.session.admin;
            res.locals.adminid = req.session.adminid;
            let sql = 'SELECT id,name FROM foods_class' // 查询食材分类表的所有id,name
            db.query(sql,(err,result)=>{
                if(err) throw err;
                // console.log(result)
                res.render('adminFoodAdd',{admin:req.cookies.admin,food_class_id:result}); 
            })
         
        }else{
            res.redirect('/admin/adminlogin'); // 如果没有cooike,则跳转管理员登录页面
        }
    })


// 上传菜谱
router.route('/uploadFood')
    .post(function(req,res) {
        //获取表单的数据 以及post过来的图片
        var form = new multiparty.Form();
        form.uploadDir = 'upload/foodsImg';   //上传图片保存的地址     目录必须存在
        form.parse(req, function (err, fields, files) {
            //获取提交的数据以及图片上传成功返回的图片信息
            // console.log(fields);  // 获取表单的数据
            // console.log(files);  // 图片上传成功返回的信息
            let params = [];
            params[0] = fields.f_c_id[0]  // 菜谱所属食物种类id
            params[1] = fields.name[0];      // 菜谱名
            params[2] = fields.cookstory[0]  // 菜谱小故事
            params[3] = fields.tips[0]     // 制作提示
            params[4] = files.img[0].path;   // 上传图片路径
            // 先菜谱详情表插入数据
            var sql = 'INSERT INTO foods_detail(f_c_id,`name`,cookstory,tips,img) VALUES(?,?,?,?,?)'  

            db.query(sql, params, (err, result) => {
                if(err) throw err;
                res.redirect('/admin/adminFoodRec');
            })
        });
    });

// 评论审核页面
router.route('/adminComments')
.get(function(req,res){
    if(req.cookies.admin && req.cookies.adminid){
        req.session.admin=req.cookies.admin;
        req.session.adminid = req.cookies.adminid;
    }
    if(req.session.admin && req.session.adminid){
        res.locals.admin=req.session.admin;
        res.locals.adminid = req.session.adminid;
        let sql = 'SELECT * FROM `comment` LIMIT 0,8'  // 查询评论表前8条数据
        let sql1 = 'SELECT COUNT(*)as count FROM `comment`' // 计算评论表数据总量
        db.query(sql, (err, result) => {
            if(err) throw err;
            db.query(sql1,(err,result1)=> {
                if(err) throw err;
                // console.log(result1)
                let count = Math.ceil(result1[0].count/8);  // 计算评论表分页页数
                // console.log(page)
                // console.log('-----------')
                res.render('adminComments',{admin:req.cookies.admin,comments:result,count:count,page:0}); 
            })
           
        })
    }else{
        res.redirect('/admin/adminlogin'); // 如果没有cooike,则跳转管理员登录页面
    }
})

// 评论违规删除功能
router.route('/deleteComments')
.post(urlencodeParser,function(req,res){
    if(req.cookies.admin && req.cookies.adminid){
        req.session.admin=req.cookies.admin;
        req.session.adminid = req.cookies.adminid;
    }
    if(req.session.admin && req.session.adminid){
        res.locals.admin=req.session.admin;
        res.locals.adminid = req.session.adminid;
        let params = req.body.id;
        let page = req.body.page;
        var sql = "DELETE FROM `comment` WHERE id=?"; // 删除指定id的评论
    
        db.query(sql, params, (err, result) => {
            if(err) throw err;
            // console.log(result)
            res.redirect('/admin/commentPage?page='+page);  // 跳转指定页面的评论审查页
        })
    }else{
        res.redirect('/admin/adminlogin'); // 如果没有cooike,则跳转管理员登录页面
    }
})

// 评论管理页面分页切换
router.route('/commentPage')
.get(urlencodeParser,function(req,res){
    if(req.cookies.admin && req.cookies.adminid){
        req.session.admin=req.cookies.admin;
        req.session.adminid = req.cookies.adminid;
    }
    if(req.session.admin && req.session.adminid){
        res.locals.admin=req.session.admin;
        res.locals.adminid = req.session.adminid;
        let page = req.query.page;
        console.log(page);
        let param = page*8; 
        let sql = "SELECT * FROM `comment` LIMIT ?,8";  // 查询评论表前8条数据
        let sql1 = 'SELECT COUNT(*)as count FROM `comment`' // 计算评论表数据总量
        db.query(sql, param, (err, result) => {
            if(err) throw err;
            // console.log(result)
            db.query(sql1,(err,result1)=> {
                if(err) throw err; 
                let count = Math.ceil(result1[0].count/8); // 计算评论表分页页数
                res.render('adminComments',{admin:req.cookies.admin,comments:result,count:count,page:page}); 
            })
         
        })
    }else{
        res.redirect('/admin/adminlogin'); // 如果没有cooike,则跳转管理员登录页面
    }

   
})


module.exports = router;