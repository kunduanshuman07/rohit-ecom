import express, { json } from "express";
import http from "http"
import cors from "cors"
import mysql from "mysql2"
import { config } from "dotenv"

const app = express()
const server = http.createServer(app);
config();
app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    })
);

app.use(json());
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
        return;
    }
    console.log('Connected to the MySQL database');
});

app.get('/products', (req, res) => {
    const query = 'SELECT * FROM Product';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send({ message: 'Error fetching products', error: err });
        }
        res.status(200).json(results);
    });
});

app.post('/orders', (req, res) => {
    const { product_id, email, delivery_address } = req.body;
    if (!product_id || !email || !delivery_address) {
        return res.status(400).send({ message: 'Product ID, email, and delivery address are required' });
    }

    const query = 'INSERT INTO Orders (product_id, email, delivery_address) VALUES (?, ?, ?)';
    db.query(query, [product_id, email, delivery_address], (err, result) => {
        if (err) {
            return res.status(500).send({ message: 'Error inserting order', error: err });
        }
        res.status(201).send({ message: 'Order inserted', order_id: result.insertId });
    });
});

app.delete('/orders/:order_id', (req, res) => {
    const order_id = req.params.order_id;
    const query = 'DELETE FROM Orders WHERE order_id = ?';

    db.query(query, [order_id], (err, result) => {
        if (err) {
            return res.status(500).send({ message: 'Error deleting order', error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Order not found' });
        }
        res.status(200).send({ message: 'Order deleted' });
    });
});

app.put('/orders/:order_id/status', (req, res) => {
    const order_id = req.params.order_id;
    const { order_status } = req.body;

    if (!order_status) {
        return res.status(400).send({ message: 'Order status is required' });
    }

    const query = 'UPDATE Orders SET order_status = ? WHERE order_id = ?';
    db.query(query, [order_status, order_id], (err, result) => {
        if (err) {
            return res.status(500).send({ message: 'Error updating order status', error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: 'Order not found' });
        }
        res.status(200).send({ message: 'Order status updated' });
    });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// DB_HOST=
// DB_USER=
// DB_PASSWORD=
// DB_NAME=
// DB_PORT=
// PORT=