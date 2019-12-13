var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
// 引入session中间件
var session=require('express-session');

// 用户控制模块
var userController = require('./controller/userController');
// 美食控制模块
var foodController = require('./controller/foodController');

var app = express();

//需要修改的
app.use(cookieParser("An"));

//需要添加的, 在[ var app = express(); ] 下方
app.use(session({
    secret:'an',
    resave:false,
    saveUninitialized:true
}));

// 上传图片路径
app.use('/upload', express.static('upload'));
// 为了后面动态图片能显示
app.use('/user/upload', express.static('upload'));  

//设置 views 文件夹为存放视图文件的目录, 即存放模板文件的地方
app.set('views', path.join(__dirname, 'views'));
// 设置使用的模版引擎，使用的ejs
app.set('view engine','ejs');

// 匹配路由路径  主路由
app.use('/user',userController);
app.use('/',foodController);

// 静态化我们的public文件下的文件，使其可以直接引用
app.use('/user',express.static(path.join(__dirname, 'public')));
app.use('/',express.static(path.join(__dirname, 'public')));


// 监听3000端口，开启服务器
app.listen(3000);
