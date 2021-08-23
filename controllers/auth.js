import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import sendEmail from "../utils/sendGrid.js";

export const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed.");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const { name, password, email, phoneNumber } = req.body;
    const hashedPw = await bcrypt.hash(password, 12);
    const user = new User({
      email,
      name,
      password: hashedPw,
      phoneNumber,
    });
    const result = await user.save();
    res.status(201).json({ message: "User created!", userId: result._id });
    const options = {
      to: email,
      from: process.env.FROM,
      subject: "Target Technology Singup",
      html: `<p>${name}, Welcome to Target technology</p>`,
    };
    sendEmail(options);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed.");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const { email, password } = req.body;
    let loadedUser;
    const user = await User.findOne({ email: email });
    /* //login with either phoneNumber or email
    //use username on the request body instead of email
    const user = await User.findOne({
      $or: [{ email: username }, { phoneNumber: username }],
    }); */
    if (!user) {
      const error = new Error("A user with this account could not be found.");
      error.statusCode = 401;
      throw error;
    }
    if (user.status === 0) {
      const error = new Error("Your account is not active");
      error.statusCode = 307;
      throw error;
    }
    loadedUser = user;
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("Wrong password!");
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        email: loadedUser.email,
        userId: loadedUser._id.toString(),
      },
      process.env.JWTSECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({ token: token, userId: loadedUser._id.toString() });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
