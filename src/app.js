const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const migrateRoute = require('./routes/migrateRoute');
const qrRoutes = require('./routes/qrRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/migrate', migrateRoute);
app.use('/api/v1/qr', qrRoutes);

app.use(errorHandler);

module.exports = app;