const mysql = require("mysql2");
var cookie = require("cookie-parser");
var session = require("express-session");
const { authenticate } = require("passport");
const request = require("request");
var bodyParser = require("body-parser")
var parser = bodyParser.urlencoded({extended:false});
var fileupload = require("express-fileupload");

let conn_info = {
    host : 'localhost',
    port : 3320,
    user : 'root',
    password : '1234',
    database : 'product'
}

//session 출력 형태
//req.user: id값
//req.session.passport: {user:id값} 
//id 세션값 : req.session.passport.user

module.exports = function(app, passport){
    app.get('/',function(req, res){
        console.log('passport.user:',req.session.passport)
        console.log('session:',req.session)
        res.render('index.ejs', {session:req.session.passport})
    })
    
    app.get('/login', function(req, res){
        res.render('login.ejs')
    })
    
    app.get('/login/kakao', passport.authenticate("kakao"))

    app.get('/login/kakao/callback', passport.authenticate('kakao', {
        successRedirect: '/',
        failureRedirect: '/login'
        })
    )

    app.get('/login/naver', passport.authenticate('naver'))

    app.get('/login/naver/callback', passport.authenticate('naver', {
        successRedirect: '/',
        failureRedirect: '/login'
    }));

    app.get('/mypage', function(req, res){
        if(!req.user){
            res.render('login.ejs')
        }else{
            let conn=mysql.createConnection(conn_info);
            conn.query('select id,role from guest_kakao where id=? union all select id,role from guest_naver where id=?',[req.user,req.user],(err, result)=>{
                console.log(err)
                if(result[0].role == 'buyer'){
                    res.render('mypage_buyer.ejs',{session:req.session.passport})
                }else{
                    res.render('mypage_seller.ejs',{session:req.session.passport})
                }
            })
        }
    })

    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/');
    })

    app.get('/regi_item', function(req, res){
        if(!req.user){
            res.render('index.ejs')
        }
        res.render('regi_item.ejs',{session:req.session.passport})
    })

    app.post('/regi_item_ing',parser, function(req, res){
        if(!req.files){     //이미지를 하나라도 전달받으면 등록안한 이미지는 undefined로 전송이 됨 => 에러 안나고 진행
                            //근데 이미지를 둘다 전송 안하면 null로 전송됨 => 에러남
            var sell_image = 'undefined'
            var content_image = 'undefined'
        }else{
            var sell_image = req.files.sell_image;
            var content_image = req.files.content_image;    
        }

        // console.log('req.files.sell_image:',req.files.sell_image)
        // console.log('req.files.content_image:',req.files.content_image)

        let conn = mysql.createConnection(conn_info);
        if(!req.files){
            let sql = 'insert into sell_product (id, title, price, category, start_date, content_text) values (?,?,?,?,?,?)'
            input_data = [req.session.passport.user, req.body.title, req.body.price, req.body.category, req.body.start_date, req.body.content_text]
            conn.query(sql, input_data, (err, result)=>{
                res.redirect('/')
            })
            console.log('아이디:',req.session.passport.user)
            console.log(req.body.category)      //name='category' <option>의 value값이 들어옴
            console.log(req.body.start_date)
        }else if(!req.files.sell_image){
            content_image.mv(__dirname+'/public/image/uploads/'+content_image.name)
            res.redirect('/')
        }else if(!req.files.content_image){
            sell_image.mv(__dirname+'/public/image/uploads/'+sell_image.name)
            res.redirect('/')
        }else{
            sell_image.mv(__dirname+'/public/image/uploads/'+sell_image.name)
            content_image.mv(__dirname+'/public/image/uploads/'+content_image.name)  
            res.redirect('/')  
        }
        
        console.log(req.body)
        console.log(req.files)
    })
}