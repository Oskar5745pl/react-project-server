import cors from'cors'
import { Db, MongoClient, ServerApiVersion , ObjectId} from 'mongodb';
import express from 'express';
import session from 'express-session'
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import router from './routes/auth.js';
import bcrypt from 'bcrypt';
import  User from './models/User.js';
import Section from './models/Section.js';
import passport from 'passport'
import jwt from 'jsonwebtoken';
import Product from './models/Product.js';
import Order from './models/Order.js';
import Session from './models/Session.js';
import emailjs from '@emailjs/browser'
import nodemailer from 'nodemailer'

const app = express()
// passport.serializeUser((user, done) => {
//   done(null, user.id);
// });

// // Deserialize user from the session
// passport.deserializeUser((id, done) => {
//   User.findById(id, (err, user) => {
//     done(err, user);
//   });
// });

app.use(session({
  secret: 'Aventadors2016?',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))
app.use(bodyParser.json());
app.use(passport.initialize());
// Routes
// app.use('../client/src/api/authApi.ts', authRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/orders', orderRoutes);
const allowedOrigins = ['http://localhost:5173', 'https://naturesradiance.netlify.app', 'https://oskar5745pl.github.io'];

app.use(cors({
  origin: function (origin, callback) {
    // Check if the origin is in the allowedOrigins array
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error('Not allowed by CORS')); // Deny the request
    }
  }
}));
const uri = "mongodb+srv://EhsanW:Aventador20242024@cluster0.yctfcgk.mongodb.net/?retryWrites=true&w=majority";
export const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db = client.db('MX');
const localIpAddress = process.env.SERVER_URL;
mongoose.connect("mongodb+srv://EhsanW:Aventador20242024@cluster0.yctfcgk.mongodb.net/?retryWrites=true&w=majority")
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

const port = 5000
function isValidEmail(email) {
  var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  return regex.test(email);
}
function extractJwtToken(inputString) {
  if (inputString.startsWith("Bearer ")) {
      return inputString.substring("Bearer ".length);
  } else {
      return inputString;
  }
}

app.get('/products/populate/:sectionID', async (req, res) => {
  const SectionCollection = db.collection('Sections');
  const ProductCollection = db.collection('Products'); // Assuming this is your products collection
  const { sectionID } = req.params;

  try {
    // Fetch products corresponding to the sectionID
    const products = await ProductCollection.find({ sectionId: (`${sectionID}`)  }).toArray();
    // Update the products array in the section document
    const result = await SectionCollection.updateOne(
      { _id: new ObjectId(sectionID) }, // Filter by section ID
      { $set: { products: products } } // Update products array with fetched products
    );

    if (result.modifiedCount === 1) {
      console.log(`Products populated successfully for section with ID: ${sectionID}`);
      res.status(200).json({ message: `Products populated successfully for section with ID: ${sectionID}` });
    } else {
      console.log(`No section found with ID: ${sectionID}`);
      res.status(404).json({ error: `No section found with ID: ${sectionID}` });
    }
  } catch (error) {
    console.error('Error populating products:', error);
    res.status(500).json({ error: 'Error populating products' });
  }
});
app.get('/products/:sectionID', async (req, res) => {
  const SectionCollection = db.collection('Sections');
  const { sectionID } = req.params;
  try {
    const section = await SectionCollection.findOne({ _id: new ObjectId(`${sectionID}`) });
    res.json(section);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Error fetching product' });
  }
});
app.get('/verify-token', (req, res) => {
  // Get token from Authorization header
  const token = extractJwtToken(req.headers.authorization);
  console.log(token);
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }else if (token){
    console.log("lol");
    // Verify token
    jwt.verify(token, 'Aventadors2016?', (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      // Attach user data to request object
      return res.status(200).json({ email: decoded.email , userId: decoded.userId , username: decoded.username, password: decoded.password});
    });
  }else{
    return res.status(401).json({ error: 'No token provided' });
  }
  
});
app.get('/api/user', async (req, res) => {
  try {
    // Fetch the user from the session or database, depending on your implementation
    const user = req.user; // Assuming you store the user in the session

    // Check if user is authenticated
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Return the user data
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'An error occurred while fetching user' });
  }
});
app.post('/addToCart', async (req, res) => {
  try {
    const { product, sessionId, userObject } = req.body;
    if (!product) {
      return res.status(400).json({ error: 'Product data is required' });
    }

    // Validate required fields for product object
    const { name, price, quantity } = product;
    if (!name || !price || !quantity) {
      return res.status(400).json({ error: 'Product name, price, and quantity are required' });
    }

    if (!userObject) {
      // If user is not authenticated
      let session = await Session.findOne({ sessionId });

      // If session not found, create a new session
      if (!session) {
        session = await Session.create({ sessionId: sessionId, cart: [{ product: product, quantity: 1 }] });
        session.save()
      } else {
        // Check if the product already exists in the cart
        const existingProductIndex = session.cart.findIndex(item => item.product._id === product._id);
        if (existingProductIndex !== -1) {
          // If product already exists, increment its quantity
          session.cart[existingProductIndex].quantity += 1;
        } else {
          // If product does not exist, add it to the cart
          session.cart.push({ product, quantity: 1 });
          console.log(session.cart);
        }
        await session.save();
      }

      return res.status(200).json({ message: 'Product added to cart successfully', sessionId });
    } else {
      // If user is authenticated
      jwt.verify(userObject, 'Aventadors2016?', async (err, decoded) => {
        if (err) {
          return res.status(401).json({ error: 'Invalid token' });
        }
        // Find the user by userId
        const user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Check if the product already exists in the cart
        const existingProductIndex = user.cart.findIndex(item => item.product._id === product._id);
        if (existingProductIndex !== -1) {
          // If product already exists, increment its quantity
          user.cart[existingProductIndex].quantity += 1;
        } else {
          // If product does not exist, add it to the cart
          user.cart.push({ product, quantity: 1 });
        }
        console.log(user.cart);
        await user.save();

        return res.status(200).json({ message: 'Product added to cart successfully' });
      });
    }
  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).json({ error: 'An error occurred while adding product to cart' });
  }
});
app.post(`/saveAddress`, async (req, res) => {
  try{
    const {address , user} = req.body
    
      
      const savedAddress = await User.findOneAndUpdate(
        { _id: user._id },
        { $set: { address: address } },
        { new: true } // Return the updated document
      );
      return res.status(200).json({ message: 'address saved successfully', savedAddress: savedAddress });
    
  }catch (errror){
    console.error('Error removing product from cart:', error);
    res.status(500).json({ error: 'An error occurred while removing product from cart' });
  }
});
app.post('/removeProduct', async (req, res) => {
  try{
    const {productId, user} = req.body
    jwt.verify(user, 'Aventadors2016?', async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      // Find the user by userId
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const updatedUser = await User.findOneAndUpdate(
        { _id: decoded.userId },
        { $pull: { cart: { _id: productId } } },
        { new: true } // Return the updated document
      );
      return res.status(200).json({ message: 'Product removed from cart successfully', cart: updatedUser.cart });
    })
  }catch (errror){
    console.error('Error removing product from cart:', error);
    res.status(500).json({ error: 'An error occurred while removing product from cart' });
  }
})
app.get('/getUserCart', async (req, res) => {
  try {
    const jwtToken = extractJwtToken(req.headers.authorization);
    if (!jwtToken) {
      return res.status(401).json({ error: 'Authorization token not provided' });
    }

    // Here you would verify and decode the JWT token to get the user ID
    // This step depends on how you implement authentication in your system
    // For simplicity, let's assume you have a function to verify and decode the token
    jwt.verify(jwtToken, 'Aventadors2016?', async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      // Find the user by userId
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      // Push product object into cartItems array
      console.log(user.cart);
      res.status(200).json({ cart: user.cart });

    });
  } catch (error) {
    console.error('Error fetching user cart:', error);
    res.status(500).json({ error: 'An error occurred while fetching user cart' });
  }
});

app.get('/getSessionCart', async (req, res) => {
  try {
    const sessionId = req.query.sessionId; // Extract sessionId from query parameters
    if (!sessionId) {
      return res.status(401).json({ error: 'SessionId not provided' });
    }
    console.log(sessionId);
    // Here you would verify and decode the sessionId to get the session
    // This step depends on how you implement session management in your system
    // For simplicity, let's assume you have a function to retrieve the session
    const session = await Session.findOne({ sessionId:sessionId });
    if (!session) {
      return res.status(406).json({ error: 'Session not found' });
    }
    console.log(session);
    res.status(200).json({ session: session });
  } catch (error) {
    console.error('Error fetching session cart:', error);
    res.status(500).json({ error: 'An error occurred while fetching session cart' });
  }
});

app.post('/createNewSession', async (req, res) => {
  try {
    const { sessionId } = req.body;
    console.log(req.body);
    const newSession = await Session.create({ sessionId, cart: { cartItems: [] } });
    console.log("2");
    res.status(200).json({ session: newSession });

  } catch (error) {
    console.error('Error creating new session:', error);
    res.status(500).json({ error: 'An error occurred while creating new session' });
  }
});
let creatingSession = false;

app.post('/checkSession', async (req, res) => {
  try {
    const sessionId = req.body.sessionId;


    // Check if session creation is already in progress
    if (creatingSession) {
      // If session creation is in progress, return a response indicating the process is ongoing
      return res.status(409).json({ message: 'Session creation is already in progress' });
    }

    // Set the flag to indicate session creation is now in progress
    creatingSession = true;

    // Check if the session exists in the Sessions collection
    const session = await db.collection('Sessions').findOne({ sessionId: sessionId });

    if (session) {
      // If session exists, return it
      return res.status(200).json({ session: session });
    } else {
      // If session does not exist, create a new one
      const newSession = await Session.create({ sessionId, cart: [] });
      await newSession.save();
      const result = await db.collection('Sessions').insertOne(newSession);
      return res.status(200).json({ session: newSession });
    }
  } catch (error) {
    console.error('Error checking session:', error );
    return res.status(500).json({ error: 'An error occurred while checking session' });
  } finally {
    // Reset the flag after session creation process is complete
    creatingSession = false;
  }
});
app.post('/api/user/usernames', async (req, res) => {
  try {
    const { username } = req.body;
    const existingUser = await User.findOne({ username:username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'An error occurred while fetching user' });
  }
});
app.post('/guestCheckout', async (req, res) => {
  try {
    const {
      debitCard,
      address,
      deliveryType,
      userForm,
      isGuest,
      billingAddress,
      session
    } = req.body; 
   
    const order = await Order.create({ 
      user: userForm,
      sessionId: session.sessionId, 
      cart: session.cart,
      address: [address, deliveryType],
      payment: [debitCard , billingAddress],
     });
    if (!order) {
      return res.status(406).json({ error: 'failure to place order' });
    }
    if(order){
      console.log("success");
      console.log(order);
      await order.save();
      await db.collection('Orders').insertOne(order);
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', // true for 465, false for other ports
        auth: {
          user: 'oskarwojtaszek007@gmail.com', // Your Gmail address
          pass: 'kqrg ebbm kvdg pifz', // Your Gmail password
        },
      });
      
      const mailOptions = {
        from: 'oskarwojtaszek007@gmail.com',
        to: userForm.email,
        subject: `Nature's radiance Order Confirmation`,
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
        </head>
          <body style="background-color: #e8e8e8de;">
            <div style="margin-left: 100px; margin-top: 100px; margin-bottom: 100px;">
              <div style="padding-top: 100px;"></div>
              <h2 style="font-family: Arial, Helvetica, sans-serif; color: #252525; font-size: 30px;">Your Order has been placed.</h2>
              <h3 style="font-family: Arial, Helvetica, sans-serif; color: #252525; padding: 10px;">Thank you for placing your order</h3>
              <h3 style="font-family: Arial, Helvetica, sans-serif; color: #252525; padding: 10px;">Order Status <span style="padding-left: 20px; font-size: larger;">${order.status}</span></h3>
              <h3 style="font-family: Arial, Helvetica, sans-serif; color: #252525; padding: 10px;">Your order will be delivered to <span style="padding-left: 20px; font-size: larger;">${address.firstName}, ${address.city}, ${address.country}</span></h3>
              <h3 style="font-family: Arial, Helvetica, sans-serif; color: #252525; padding: 10px;">Order Number <span style="padding-left: 20px; font-size: larger;">${order._id}</span></h3>
              <h3 style="font-family: Arial, Helvetica, sans-serif; color: #252525; padding: 10px;">Delivery Option <span style="font-size: larger; padding-left: 20px">${deliveryType}</span></h3>
              <h3 style="font-family: Arial, Helvetica, sans-serif; color: #252525; padding: 10px;">You can manage your order by entering your order number in the order tracking<span style="font-size: larger; padding-left: 20px">${order._id}</span> on the order tracker section of the <a href="https://mwhouse.netlify.app" style="font-family: Arial, Helvetica, sans-serif; color: #123524;">Natures Radiance</a>. website</h3>
              <h3 style="font-family: Arial, Helvetica, sans-serif; color: #252525; padding: 10px;">Description about the booking : <span style="font-size: larger; padding-left: 20px">${order.cart[0]}</span></h3>
              <h2 style="font-family: Arial, Helvetica, sans-serif; color: #252525; font-size: 30px;">The products you ordered.</h2>
            </div>
          </body>
        </html>
        `
      };
      await transporter.sendMail(mailOptions);
      const updatedSession = await Session.findOneAndUpdate(
        { sessionId: session.sessionId },
        { $set: { cart: [] } },
        { new: true } // Return the updated document
      )
      if (!updatedSession) {
        console.log('Session not found');
        return null;
      }
      res.status(200).json({ message: "the order has been placed" });
    }
  } catch (error) {
    console.error('Error placing the order:', error);
    res.status(500).json({ error: 'An error occurred while placing the order' });
  }
});


app.post('/userCheckout', async (req, res) => {
  try {
    const {
      debitCard,
      address,
      deliveryType,
      userForm,
      isGuest,
      billingAddress,
      session,
      user
    } = req.body; 
   
    const order = await Order.create({ 
      user: user._id,
      sessionId: session.sessionId, 
      cart: session.cart,
      address: [address, deliveryType],
      payment: [debitCard , billingAddress],
     });
    if (!order) {
      return res.status(406).json({ error: 'failure to place order' });
    }
    if(order){
      console.log("success");
      console.log(order);
      await order.save();
      await db.collection('Orders').insertOne(order);
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', // true for 465, false for other ports
        auth: {
          user: 'oskarwojtaszek007@gmail.com', // Your Gmail address
          pass: 'kqrg ebbm kvdg pifz', // Your Gmail password
        },
      });
      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        { $set: { cart: [] } },
        { new: true } // Return the updated document
      )
      await updatedUser.save()
      if (!updatedSession) {
        console.log('Session not found');
        return null;
      }
      const mailOptions = {
        from: 'oskarwojtaszek007@gmail.com',
        to: user.email,
        subject: `Nature's radiance Order Confirmation`,
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
        </head>
          <body style="background-color: #e8e8e8de;">
            <div style="margin-left: 100px; margin-top: 100px; margin-bottom: 100px;">
              <div style="padding-top: 100px;"></div>
              <h2 style="font-family: Arial, Helvetica, sans-serif; color: #252525; font-size: 30px;">Your Order has been placed.</h2>
              <h3 style="font-family: Arial, Helvetica, sans-serif; color: #252525; padding: 10px;">Thank you for placing your order</h3>
              <h3 style="font-family: Arial, Helvetica, sans-serif; color: #252525; padding: 10px;">Order Status <span style="padding-left: 20px; font-size: larger;">${order.status}</span></h3>
              <h3 style="font-family: Arial, Helvetica, sans-serif; color: #252525; padding: 10px;">Your order will be delivered to <span style="padding-left: 20px; font-size: larger;">${address.firstName}, ${address.city}, ${address.country}</span></h3>
              <h3 style="font-family: Arial, Helvetica, sans-serif; color: #252525; padding: 10px;">Order Number <span style="padding-left: 20px; font-size: larger;">${order._id}</span></h3>
              <h3 style="font-family: Arial, Helvetica, sans-serif; color: #252525; padding: 10px;">Delivery Option <span style="font-size: larger; padding-left: 20px">${deliveryType}</span></h3>
              <h3 style="font-family: Arial, Helvetica, sans-serif; color: #252525; padding: 10px;">You can manage your order by entering your order number in the order tracking<span style="font-size: larger; padding-left: 20px">${order._id}</span> on the order tracker section of the <a href="https://naturesradiance.netlify.app" style="font-family: Arial, Helvetica, sans-serif; color: #123524;">Natures Radiance</a>. website</h3>
              <h3 style="font-family: Arial, Helvetica, sans-serif; color: #252525; padding: 10px;">Description about the booking : <span style="font-size: larger; padding-left: 20px">${order.cart[0]}</span></h3>
              <h2 style="font-family: Arial, Helvetica, sans-serif; color: #252525; font-size: 30px;">The products you ordered.</h2>
            </div>
          </body>
        </html>
        `
      };
      await transporter.sendMail(mailOptions);

      res.status(200).json({ message: "the order has been placed" });
    }
  } catch (error) {
    console.error('Error placing the order:', error);
    res.status(500).json({ error: 'An error occurred while placing the order' });
  }
});
app.post('/forget-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if email is valid
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user with the provided email exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate a unique token for password reset
    const resetToken = jwt.sign({ userId: user._id }, "Aventadors2016?", { expiresIn: '1h' });

    // Save the token in the user document in the database
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration
    await user.save();

    // Send password reset email to the user
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'oskarwojtaszek007@gmail.com', // Your Gmail address
          pass: 'kqrg ebbm kvdg pifz', // Your Gmail password
      }
    });

    const mailOptions = {
      from: 'oskarwojtaszek007@gmail.com',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <p>You are receiving this email because you (or someone else) has requested a password reset for your account.</p>
        <p>Please click on the following link to reset your password:</p>
        <a href="http://localhost:5173/reset-password/${resetToken}">http://localhost:5173/reset-password/${resetToken}</a>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset email sent. Please check your inbox.' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server Error' });
  }
});
app.post('/reset-password/:resetToken', async (req, res) => {
  const {  newPassword } = req.body;
  const { resetToken } = req.params
  try {
    // Check if email is valid
    jwt.verify(resetToken, 'Aventadors2016?', async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      // Find the user by userId
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      // Push product object into cartItems array
      const updatedPassword = await User.findOneAndUpdate(
        { _id: user._id },
        { $set: { password : newPassword} },
        { new: true } // Return the updated document
      )
      await user.save();
      if(updatedPassword){
        res.status(201).json({ message: "password changed" });
      }
      

    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server Error' });
  }
});
app.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    // Validate request body
    // Hash password
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const users = await db.collection('Users').find({}).toArray();
    const existingEmail = await User.findOne({ email:email  });
    console.log(users);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email is already Registered' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (password != confirmPassword) {
      return res.status(400).json({ error: 'Passwords dont match' });
    }
    const existingUser = await User.findOne({ username:username });
    console.log(existingUser);
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }
    // Create user in database
    try {
      const bcryptPassword = await bcrypt.hash(password, 10)
      const newUser =  User({ username: username, email:email, password: bcryptPassword }); 
      await newUser.save();
      const result = await db.collection('Users').insertOne(newUser);
      console.log("User created:", result);
      const user = await User.findOne({ email:email });
      if (user) {
        const token = jwt.sign({ userId: user._id, email: user.email, username:user.username , password:user.password, cartItems: user.cart.cartItems, orders: user.orders }, 'Aventadors2016?', { expiresIn: '1h' });
        res.status(201).json({ token });
      } else {
        res.status(400).json({ error: 'Registration failed' });
      }
    } catch (error) {
      console.error('Error creating User:', error);
      res.status(500).json({ error: 'An error occurred while creating the User' });
    }
    
  } catch (error) {
    // Handle error
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'An error occurred during registration' });
  }
})

app.post("/login", async (req, res) => {
  const { email , password } = req.body;
  let errors = [];
  console.log(email);
  try {
    const user = await User.findOne({ email:email });
    
    if (user) {
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          throw err;
        }
        if (isMatch) {
          if (user) {
            const token = jwt.sign({ userId: user._id, email: user.email, username:user.username , password:user.password, cartItems: user.cart.cartItems, orders: user.orders  }, 'Aventadors2016?', { expiresIn: '1h' });
            res.status(200).json({ token , success: true, user:user});
          } else {
            res.status(401).json({ error: 'Invalid credentials' });
          }
        } else {
          errors.push({ message: "Password is incorrect" });
          res.status(400).json({ success: false, errors });
        }
      });
    } else {
      errors.push({ message: "Email not registered" });
      res.status(400).json({ success: false, errors });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, errors: [{ message: "Internal Server Error" }] });
  }
});
app.get('/verify-token', (req, res) => {
  // Get token from Authorization header
  const token = extractJwtToken(req.headers.authorization);
  console.log(token);
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }else if (token){
    console.log("lol");
    // Verify token
    jwt.verify(token, 'Aventadors2016?', (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      // Attach user data to request object
      return res.status(200).json({ email: decoded.email , userId: decoded.userId , username: decoded.username, password: decoded.password});
    });
  }else{
    return res.status(401).json({ error: 'No token provided' });
  }
  
});
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
app.get("/products/build-your-bundle?section", (req, res) => {
  const section = req.params.section;
  const sectionProducts = products[section];
  if (sectionProducts) {
    res.json(sectionProducts);
  } else {
    res.status(404).json({ error: "Section not found" });
  }
});
// Gracefully close the MongoDB connection when the app is terminated
process.on('SIGINT', async () => {
  try {
    await client.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  } catch (err) {
    console.error("Error closing MongoDB connection", err);
    process.exit(1);
  }
});
