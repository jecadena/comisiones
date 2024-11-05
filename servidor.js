const express = require('express');
const mysql = require('mysql');

const app = express();
const port = 3000;

// Configuración de la conexión a la base de datos
const connection = mysql.createConnection({
  host: '192.168.1.105',
  user: 'root',
  password: '',
  database: 'gds'
});

// Conexión a la base de datos
connection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conexión a la base de datos establecida');
});

// Ruta de ejemplo para consultar datos desde la base de datos
app.get('/usuarios', (req, res) => {
  // Realizar una consulta a la base de datos
  connection.query('SELECT * FROM usuariosgds', (error, results) => {
    if (error) {
      console.error('Error al realizar la consulta:', error);
      return res.status(500).json({ error: 'Error al consultar la base de datos' });
    }
    res.json(results); // Enviar los resultados como respuesta
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor iniciado en http://192.168.1.105:${port}`);
});
