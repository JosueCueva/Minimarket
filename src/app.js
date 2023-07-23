const express = require('express');
const { engine } = require('express-handlebars');
const myconnection = require('express-myconnection');
const mysql = require('mysql');
const session = require('express-session');
const bodyParser = require('body-parser')

const loginRoutes = require('./routes/login');
const { redirect } = require('express/lib/response');

const app = express();
app.set('port', 4000);

app.set('views', __dirname + '/views');
app.engine('.hbs', engine({
	extname: '.hbs',
}));
app.set('view engine', 'hbs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.use(myconnection(mysql, {
 host: 'localhost',
 user: 'root',
 password: '',
 port: 3306,
 database: 'minimarket'
}, 'single'));

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

function checkLoggedIn(req, res, next) {
	if (!req.session.loggedin) {
	  return res.redirect('/login');
	}
	next();
  }

app.get('/products', checkLoggedIn, (req, res) => {
  req.getConnection((err, conn) => {
    if (err) {
      console.error('Error al conectar con la base de datos:', err);
      return res.render('error');
    }

    conn.query('SELECT * FROM productos', (err, products) => {
      if (err) {
        console.error('Error al consultar los productos:', err);
        return res.render('error');
      }

      res.render('products', { products, name: req.session.name });
    });
  });
});

app.use('/', loginRoutes);

app.get('/', (req, res) => {
	if (req.session.loggedin) {
 		res.render('home', { name: req.session.name });
	} else {
		res.redirect('/login');
	}
});

app.listen(app.get('port'), () => {
	console.log('listening on port ', app.get('port'));
   });