const express = require('express');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const gatewayRoutes = require('./routes/gateway');
const proxyRoutes = require('./routes/proxy');

const app = express();

app.use(express.json());

// Route proxy dinamis yang meneruskan request ke service tujuan
app.use('/api', proxyRoutes);

// Routes tanpa autentikasi (misal register dan login)
app.use('/auth', authRoutes);

// Route untuk admin dan superadmin
app.use('/admin', adminRoutes);

// Route untuk kelola services / katalog API
app.use('/gateway', gatewayRoutes);

// Handle 404 jika route tidak ditemukan
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler (opsional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});