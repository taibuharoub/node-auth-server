import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import sendEmail from "../utils/sendGrid.js";
import generateToken from "../utils/resetToken.js";
import sendSms from "../utils/sendSms.cjs";
import { generateVerificationCode } from "../helpers/index.js";

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
    // const resetUrl = `${req.protocol}://${req.get(
    //   "host"
    // )}/auth/passwordreset/${token}`;
    const resetUrl = `http://127.0.0.1:5500/?token=${token}`;

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
    const { newPassword, token } = req.body;
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
    res.status(200).json({ message: "Password Reset Successfully" });
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

export const altReset = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Please provide a phone number.");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const { phoneNumber } = req.body;
    const user = await User.findOne({ phoneNumber: phoneNumber });
    if (!user) {
      const error = new Error("User account not be found.");
      error.statusCode = 401;
      throw error;
    }
    const verificationCode = await generateVerificationCode(1000, 9999);
    const hashedCode = await bcrypt.hash(verificationCode.toString(), 12);
    user.verificationCode = hashedCode;
    user.verificationCodeExpiration = Date.now() + 10 * 60 * 1000; //10 mins
    await user.save();
    const message = `Your Password Reset Code is ${verificationCode}`;
    const smsResult = await sendSms(phoneNumber, message);
    if (smsResult?.SMSMessageData?.Recipients[0].status === "Success") {
      return res.status(200).json({
        message: `Reset code sent to phone number ${phoneNumber}`,
      });
    } else {
      return res.status(500).json({
        message: "Failed to send verification code",
      });
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const altResetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed.");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const { phoneNumber, verificationCode, newPassword } = req.body;
    const user = await User.findOne({ phoneNumber: phoneNumber });
    if (!user) {
      const error = new Error("Account not found");
      error.statusCode = 422;
      throw error;
    }
    const isValid = await bcrypt.compare(
      verificationCode,
      user.verificationCode
    );
    if (!isValid) {
      const error = new Error("Code verification failed.");
      error.statusCode = 422;
      throw error;
    }
    const isActive = user.verificationCodeExpiration > Date.now();
    if (!isActive) {
      const error = new Error(
        "Code verification Expired, please request a new one."
      );
      error.statusCode = 422;
      throw error;
    }
    const hashedPw = await bcrypt.hash(newPassword, 12);
    user.password = hashedPw;
    user.verificationCode = undefined;
    user.verificationCodeExpiration = undefined;
    await user.save();
    res.status(200).json({
      message: "Password Reset Successfully, login with new password",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
