const PORT = process.env.PORT || 5000;

const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
require('dotenv').config();
const cors = require("cors");



// Connection to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const app = express();

app.use(express.json());


const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",").map(o => o.trim()) : ['*']

const cors_setup = {
  origin: function (origin, callback){
    if(!origin) return callback(null,true)

    if(allowedOrigins.includes('*')||allowedOrigins.includes(origin)){
      return callback(null, true)
    }

    return callback(new Error(`The CORS policy forbids access from the origin: ${origin}`))
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','From']

}
app.use(cors(cors_setup));



// User Schema for MongoDB
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true },
  connectedAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// Nodemailer Transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS 
  }
});

// Connection route handler
app.post('/api/connect', async (req, res) => {
  try {
    const { email } = req.body;

    // Email Validation
    if (!email) {
      return res.status(400).json({ error: 'Email is required!' });
    }

    // Save user to MongoDB
    const user = new User({ email });
    await user.save();

    // Email notification setup
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Connection Successful!',
      text: 'Hello! You have successfully connected to our platform server.',
      html: '<h1>Connection Success</h1><p>Your email has successfully hooked up to our node system.</p>'
    };

    // Sending the email
    await transporter.sendMail(mailOptions);
    console.log(`Notification sent successfully to ${email}`);

    // Server successful response
    return res.status(201).json({
      message: 'Email successfully used and notification sent!',
      user: { email }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Fallback route for unmatched requests
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

module.exports = app;
