import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';


export const register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    // Validate request body
    // Hash password
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (password != confirmPassword) {
      return res.status(400).json({ error: 'Passwords dont match' });
    }
    if (password != confirmPassword) {
      return res.status(400).json({ error: 'Passwords dont match' });
    }
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }
    // Create user in database
    try {
      const newUser = { username, email, password, confirmPassword }; // Assuming the request body contains the booking data
      const result = await db.collection('Users').insertOne(newUser);
      console.log("User created:", result);
      res.status(201).json(result); // Return the created booking
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ error: 'An error occurred while creating the booking' });
    }
    // Return success response
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    // Handle error
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'An error occurred during registration' });
  }
};

export const login = async (req, res) => {
  try {
    // Validate request body
    // Find user in database
    // Compare passwords
    // Generate JWT token
    // Return token to client
  } catch (error) {
    // Handle error
  }
};

