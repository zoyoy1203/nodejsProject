var bodyParser = require('body-parser');
//对数据进行解析
var urlencodeParser = bodyParser.urlencoded({extended:false});
var express = require('express');
// 获取数据库连接
const db = require('../db/db_connect');

var router = express.Router();

// 美食首页
router.route('/index')
    // get请求渲染登录页面
    .get(function (req,res) {
        let sql = 'SELECT * FROM foods_detail WHERE recommend=1';
        db.query(sql, (err, result) => {
            if (err) throw err;
            console.log(req.cookies.islogin)
            if(req.cookies.islogin){
                req.session.islogin=req.cookies.islogin;
            }
            if(req.session.islogin){
                res.locals.islogin=req.session.islogin;
                res.render('index', { recommend_foods:result,username:res.locals.islogin});
            }else{
                res.render('index', { recommend_foods:result,username:null});
            }
          
        })
    })

// 菜谱页面
router.route('/foodclass')
    // get请求渲染登录页面
    .get(function (req,res) {
        let sql1 = 'SELECT * FROM foods_main_class';
        let sql2 = 'SELECT * FROM foods_child_class WHERE f_m_id = ?';
        let sql3 = 'SELECT * FROM foods_class WHERE f_c_id =?'
    
        db.query(sql1, (err, result) => {
            if (err) throw err;
            var foods = [];
          

            for(let i=0;i<=result.length-1;i++){
                let food = {};
               
                var food_main_id = result[i].id;
                
                food.name = result[i].name;
                food.id = food_main_id;
            
                var promise = new Promise(function (resolve, reject) {
                    db.query(sql2,food_main_id,(err,result1) => {
                        if (err) throw err;
                        // console.log(food)
                        // console.log(result1.length)
                        var foods_child = [];
                        for(let j=0;j<result1.length;j++){
                            let food_c = {};
                            // console.log(j)
                            var food_child_id = result1[j].id;
                            
                            food_c.name = result1[j].name;
                            food_c.id = result1[j].id;
                            foods_child[j] = food_c;
                            // console.log(foods_child[j])
                        }
                        // console.log(foods_child)
                        resolve(foods_child)
                    }) 
        
                });

                promise.then(function (value) {
                  
                    var child = value.slice(0)
                    // console.log(child)
                    food.food_child = child;
                    foods[i]=food
                    // console.log(foods[i].food_child)
                    // if(i == result.length-1){
                    //     res.send(foods)
                    // }
                }).then(function(value){
                    // let food_child = foods[i].food_child
                    let food_child = food.food_child
                    // console.log(food_child)
                    // console.log('len:'+food_child.length)
                    for(let t=0;t<food_child.length-1;t++){
                        // console.log(t)
                        // console.log(food_child[t].id)
                        var promise = new Promise(function (resolve, reject) {
                            db.query(sql3,food_child[t].id, (err, result3) => {
                                // console.log(result3)
                                var f = []
                                if(result3){
                                    for(var n=0;n<result3.length;n++){
                                        var ff = {}
                                        ff.name = result3[n].name;
                                        ff.id = result3[n].id;
                                        f[n]=ff;
                                    }
                                    resolve(f)
                                    // console.log( foods)
                                    // foods[i].food_child[t].foods = f
                                }
                            });
                
                        });
                
                        promise.then(function (value) {
                            var f = value.slice(0)
                            // console.log('f---'+f)
                            // console.log(t)
                            // console.log('foods[i]:=='+foods[i].food_child[t])
                            food_child[t].foods = f
                            if(i == result.length-1 && t==food_child.length-2){
                                // res.send(foods)
                                res.render('foodclass',{username:req.cookies.islogin,foods:foods})
                            }
                        })
                        promise.catch(function(value){
                            console.log('出错！')
                        })
                      
                        
                    }
                })
                promise.catch(function(value){
                    console.log('出错！')
                })
       

            }
        
        })


    })
   
// 美食页面
router.route('/foods')
    // get请求渲染登录页面
    .get(function (req,res) {
        // console.log(req.query.id)
        let params = req.query.id
        let sql = 'SELECT * FROM foods_detail WHERE f_c_id=?';
        db.query(sql, params,(err, result) => {
            if (err) throw err;
            if(req.cookies.islogin){
                req.session.islogin=req.cookies.islogin;
            }
            if(req.session.islogin){
                res.locals.islogin=req.session.islogin;
            }
            // console.log(result)
            res.render('foods', { foodclass:req.query.foodclass,foods:result,username:res.locals.islogin});
        })
    })

// 菜谱详情页面
router.route('/fooddetail')
    // get请求渲染登录页面
    .get(function (req,res) {
        let params = req.query.id
        let sql = 'SELECT * FROM foods_detail WHERE id = ?';
        db.query(sql,params, (err, result) => {
            if (err) throw err;
            console.log(result)
            result[0].cookstory=result[0].cookstory.replace(/\\n/g,'\n') // 将字符串里的\\n 替换为\n  这样就能在页面上换行输出
            console.log(result)
            res.render('fooddetail',{food:result[0],username:req.cookies.islogin})
        
        })


    })
   

module.exports = router;