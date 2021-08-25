import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import sendEmail from "../utils/sendGrid.js";
import generateToken from "../utils/resetToken.js";

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
      { expiresIn: "60000" } //"1h"
    );
    res.status(200).json({ token: token, userId: loadedUser._id.toString() });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed.");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    await User.findByIdAndUpdate(req.userId, req.body);
    res.status(200).json({
      message: "User details successfully updated",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed.");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const { newPassword, currentPassword } = req.body;
    const user = await User.findById(req.userId);
    const isEqual = await bcrypt.compare(currentPassword, user.password);
    if (!isEqual) {
      const error = new Error("Wrong or Incorrect password!");
      error.statusCode = 401;
      throw error;
    }
    const hashedPw = await bcrypt.hash(newPassword, 12);
    user.password = hashedPw;
    await user.save();
    res.status(200).json({
      message: "Successfully updated your password",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const reset = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed.");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const { email } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("No account with that email found.");
      error.statusCode = 422;
      throw error;
    }
    const token = await generateToken();
    user.resetPasswordToken = token;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; //10 mins
    await user.save();
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/auth/passwordreset/${token}`;

    const options = {
      to: email,
      from: process.env.FROM,
      subject: "Password Reset - Target Technology",
      html: `
      <p>You requested a password reset</p>
      <p>You are receiving this email because you (or someone else) has
      requested the reset of password. Please make a PUT request to:\n\n ${resetUrl}</p>
      `,
    };
    sendEmail(options);

    res
      .status(200)
      .json({ message: "Your pass reset url has been sent to your email" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// eslint-disable-next-line no-unused-vars
/* export const passwordReset = async (req, res, next) => {
  res.status(200).json({ message: "Password reset page/form" });
}; */
export const passwordReset = async (req, res, next) => {
  try {
    const token = req.params.token;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
      const error = new Error("Invalid or expired token.");
      error.statusCode = 422;
      throw error;
    }
    res.status(200).json({ message: "Password reset page/form" });
    // res.status(200).send(
    //   // eslint-disable-next-line quotes
    //   '<form method="PUT" action="/resetpassword"><input type="password" name="newPassword"><button type="submit">Submit</button></form>'
    // );
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed.");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const token = req.params.token;
    const { newPassword } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
      const error = new Error("Invalid or expired token.");
      error.statusCode = 422;
      throw error;
    }
    const hashedPw = await bcrypt.hash(newPassword, 12);
    user.password = hashedPw;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.status(200).json({ message: "Redirect User to set new password" });
    const options = {
      to: user.email,
      from: process.env.FROM,
      subject: "Target Technology",
      // eslint-disable-next-line quotes
      html: `<p>Password Reset Successfully</p>`,
    };
    sendEmail(options);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
