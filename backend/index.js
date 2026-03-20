require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const useragent = require('express-useragent');
const bcryptjs = require('bcryptjs');
const path = require('path');
const twilio = require('twilio');

// Add this to resolve the deprecation warning
mongoose.set('strictQuery', false);


const app = express();

// Trim trailing spaces/newlines from URLs to avoid 404s
app.use((req, res, next) => {
  req.url = req.url.trim();
  next();
});


// Models (unchanged)
const users = require('./models/user/users');
const Token = require('./models/user/tokenmodel');
const wasteSubmissions = require('./models/user/wasteSubmissions');
const category = require('./models/admin/category');
const collectorAssignment = require('./models/admin/collectorAssignment');
const video = require('./models/admin/video');
const collectorApplications = require('./models/collector/collectorApplications');
const sellerApplications = require('./models/user/sellerApplications'); // ✅ Added seller application model

// Routes (unchanged)
const registerRoutes = require('./routes/register');
const loginRoutes = require('./routes/login');
const wastesRoutes = require('./routes/wastes');
const categorysRoutes = require('./routes/categorys');
const viewusersRoutes = require('./routes/viewusers');
const viewsubmissionsRoutes = require('./routes/viewsubmissions');
const updateRoutes = require('./routes/update');
const deleteRoutes = require('./routes/delete');
const profileRoutes = require('./routes/profile');
const assignRoutes = require('./routes/assign');
const collectorRoutes = require('./routes/pickups');
const videoRoutes = require('./routes/videoRoute');
const resetPasswordRoutes = require('./routes/resetPassword');
const usermanagementRoutes = require('./routes/usermanagement');
const applyRoutes = require('./routes/apply');
const approveRoutes = require('./routes/approve');
const predictRoutes = require('./routes/predict');
const subscriptionRoutes = require('./routes/subscription');
const ordersRoutes = require('./routes/orders');
const productRoutes = require('./routes/product');
const sellerApplicationRoutes = require('./routes/sellerApplication'); // ✅ Added seller application route
const eventsRoutes = require('./routes/events'); // ✅ Added events route
const leaveApplicationRoutes = require('./routes/leaveApplications'); // ✅ Added leave application route
// Import Firebase Admin for testing
const { auth: firebaseAuth } = require('./firebaseAdmin');


// -----------------------------------------------------------------
// MIDDLEWARES - APPLYING FIXES HERE
// -----------------------------------------------------------------
app.use(useragent.express());
// 1. UPDATED CORS CONFIGURATION (allow Flutter web + mobile)
app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins, including Flutter web (http://localhost:xxxx)
    // and mobile apps (which often have no origin)
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token'],
  credentials: true
}));
app.use(helmet());
app.use(bodyParser.json({ limit: '10mb' })); // Increase limit for larger payloads
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 2. CROSS-ORIGIN-RESOURCE-POLICY FIX for image loading
app.use((req, res, next) => {
  // Set the CORP header to 'cross-origin' to allow the browser to embed 
  // resources from a different port (your image serving)
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  // Also set COOP and COEP headers to fix popup issues
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// Log full request URL (unchanged)
app.use((req, res, next) => {
  const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  console.log(`Request URL: ${fullUrl}`);
  next();
});

// Default route (unchanged)
app.get('/', (req, res) => {
  res.send('✅ Server is up and running!');
});

// Test Firebase Admin route
app.get('/test-firebase', async (req, res) => {
  try {
    // Try to get the Firebase project info
    const projectId = await firebaseAuth.projectId;
    console.log('Firebase project ID:', projectId);

    res.json({
      message: 'Firebase Admin SDK is working',
      projectId: projectId || 'Unable to get project ID'
    });
  } catch (error) {
    console.error('Firebase test error:', error);
    res.status(500).json({
      message: 'Firebase Admin SDK test failed',
      error: error.message
    });
  }
});

// STATIC FILE SERVING (Already correct)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection — start early and wait before API routes (fixes 500 on Vercel serverless)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const mongoosePromise = mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
})
  .then(() => { console.log('✅ DATABASE CONNECTED SUCCESSFULLY'); })
  .catch(err => {
    console.error('❌ Error connecting to database');
    console.error('Error details:', err);
    throw err;
  });

// Ensure DB is connected before handling API requests (prevents 500 on cold start)
app.use('/api', async (req, res, next) => {
  try {
    await mongoosePromise;
    next();
  } catch (err) {
    console.error('DB not ready:', err.message);
    res.status(503).json({ message: 'Service temporarily unavailable. Please retry.' });
  }
});

// Routes (unchanged)
app.use('/api/user', registerRoutes);
app.use('/api/user', loginRoutes);
app.use('/api/user', wastesRoutes);
app.use('/api/user', viewusersRoutes);
app.use('/api/user', viewsubmissionsRoutes);
app.use('/api/user', updateRoutes);
app.use('/api/user', deleteRoutes);
app.use('/api/user', profileRoutes);
app.use('/api/user', assignRoutes);
app.use('/api/user', resetPasswordRoutes);
app.use('/api/collector', collectorRoutes);
app.use('/api/category', categorysRoutes);
app.use('/api/user', usermanagementRoutes);
app.use('/api/user', applyRoutes);
app.use('/api/user', approveRoutes);
app.use('/api/user', predictRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/product', productRoutes);
app.use('/api/seller', sellerApplicationRoutes); // ✅ Added seller application route
app.use('/api/events', eventsRoutes); // ✅ Added events route
app.use('/api/leave-applications', leaveApplicationRoutes); // ✅ Added leave application route
app.use('/api/messages', require('./routes/messages')); // ✅ Added messages route
app.use('/api/salary', require('./routes/salary')); // ✅ Added salary route
app.use('/api/collector-dashboard', require('./routes/collectorDashboard')); // ✅ Added collector dashboard route
app.use('/api/iot', require('./routes/iotRoutes')); // ✅ Added IoT routes
app.use('/api/cleaning-requests', require('./routes/cleaningRequests')); // ✅ Added cleaning requests
app.use('/api/notifications', require('./routes/notifications')); // ✅ Added notifications route
app.use('/api/recycling', require('./routes/recycling')); // ✅ Added recycling data route


// Handle 404 (unchanged)
app.use((req, res) => {
  res.status(404).json({ message: '❌ Endpoint not found' });
});

// Start server locally; export app for Vercel
// Use a dedicated BACKEND_PORT env var or default to 4321
const port = process.env.BACKEND_PORT || 4321;

if (process.env.VERCEL) {
  // In Vercel serverless environment, we just export the app
  module.exports = app;
} else {
  // Local / non-Vercel environment: start the HTTP server
  app.listen(port, '0.0.0.0', () => {
    console.log(`✅ SERVER RUNNING ON PORT: ${port}`);
  });
}