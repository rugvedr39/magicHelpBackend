const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./utils/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const mlmRoutes = require('./routes/mlmRoutes');
const epinRoutes = require('./routes/epinRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cors = require('cors');



dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/mlm', mlmRoutes);
app.use('/epins', epinRoutes);
app.use('/payments', paymentRoutes);
app.use('/admin', adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
