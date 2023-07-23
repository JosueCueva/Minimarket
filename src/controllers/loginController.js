const bcrypt = require('bcrypt')
const mysql = require('mysql2');

function login(req, res) {
    if (req.session.loggedin) {
      res.redirect('/');
      
    } else {
      res.render('login/index');
    }
}

function auth(req, res) {
  const data = req.body

  req.getConnection((err, conn) => {
    conn.query('SELECT * FROM users WHERE email = ?', [data.email], (err, userdata) => {

      if(userdata.length > 0) {

        userdata.forEach(element => {
          bcrypt.compare(data.password, element.password, (err, isMatch) => {
          
            if(!isMatch){
              res.render('login/index', { error: 'Error: la contraseña es incorrecta '})
            }else{

              req.session.loggedin = true
              req.session.name = element.name

              res.redirect('/')
            }
          });
        })
      } else {
        res.render('login/index', { error: 'Error: el usuario no esta registrado '})
      }

    });
  });
}

function register(req, res) {
  if (req.session.loggedin) {
    res.redirect('/');
    
  } else {
    res.render('login/register');
  }
}
  
function storeUser(req, res) {
    const data = req.body;

    if(!isPasswordSecure(data.password)) {
      return res.render('login/register', {
        error: 'Error: la contraseña no es lo suficientemente segura. Debe contener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&).'
      })
    }

    req.getConnection((err, conn) => {
        conn.query('SELECT * FROM users WHERE email = ?', [data.email], (err, userdata) => {
            if(userdata.length > 0){
                res.render('login/register', { error: 'Error: el usuario ya esta registrado '})
            }else{
                bcrypt.hash(data.password,12).then(hash => {
                    data.password = hash
                    req.getConnection((err, conn) => {
                        conn.query('INSERT INTO users SET ?', [data], (err, rows) => {
                          req.session.loggedin = true
                          req.session.name = data.name
                          res.redirect('/')
                        })
                    })
                })
            }
        })
    })
}
  
function isPasswordSecure(password) {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

function logout(req, res) {
  if (req.session.loggedin) {
    // Limpiar información de búsqueda al cerrar sesión
    delete req.session.product;
    delete req.session.minPrice;
    delete req.session.maxPrice;

    req.session.destroy();
  }
  res.redirect('/login');
}

function register(req, res) {
  if (req.session.loggedin) {
    res.redirect('/')
    
  } else {
    res.render('login/register')
  }
}

function searchProducts(req, res) {
  const product = req.query.product || '';
  const minPrice = parseFloat(req.query.minPrice) || 0;
  const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;

  if (!product && minPrice === 0 && maxPrice === Number.MAX_SAFE_INTEGER) {
    req.getConnection((err, conn) => {
      if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return res.status(500).send('Error en el servidor.');
      }

      const sql = `SELECT * FROM products`;

      conn.query(sql, (err, products) => {
        if (err) {
          console.error('Error al consultar los productos:', err);
          return res.status(500).send('Error en el servidor.');
        }

        res.render('products', { products });
      });
    });
  } else {
    req.getConnection((err, conn) => {
      if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return res.status(500).send('Error en el servidor.');
      }

      const sql = `SELECT * FROM products WHERE nombre LIKE ? AND precio >= ? AND precio <= ?`;
      const params = [`%${product}%`, minPrice, maxPrice];

      conn.query(sql, params, (err, products) => {
        if (err) {
          console.error('Error al consultar los productos:', err);
          return res.status(500).send('Error en el servidor.');
        }

        res.render('products', { products, product, minPrice, maxPrice });
      });
    });
  }
}

module.exports = {
  login,
  register,
  storeUser,
  auth,
  logout,
  searchProducts,
}
  