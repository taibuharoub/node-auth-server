import express from "express";
import { body } from "express-validator";

import {
  signup,
  login,
  updateUser,
  updatePassword,
  reset,
  resetPassword,
  passwordReset,
  altReset,
  altResetPassword,
} from "../controllers/auth.js";
import User from "../models/User.js";
import isAuth from "../middleware/isAuth.js";

const router = express.Router();

router.post(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      // eslint-disable-next-line no-unused-vars
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("E-Mail address already exists!");
          }
        });
      })
      .normalizeEmail(),
    body(
      "password",
      "Please Password has to be atleast 6 characters and Alphanumeric"
    )
      .isLength({ min: 6 })
      .isAlphanumeric(),
    body("name").trim().not().isEmpty().withMessage("Please add a name"),
    body("phoneNumber")
      .trim()
      .not()
      .isEmpty()
      .withMessage("Please add a phone number")
      .isLength({ min: 13, max: 13 })
      .withMessage("Please provide a 13 digit number"),
  ],
  signup
);

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),
    body("password", "Password has to be valid.")
      .isLength({ min: 6 })
      .isAlphanumeric(),
  ],
  login
);

router.put(
  "/updateuser",
  body("name").trim().not().isEmpty().withMessage("Please add a name"),
  isAuth,
  updateUser
);

router.put(
  "/updatepassword",
  [
    body("currentPassword", "Please provide your current password")
      .isLength({ min: 6 })
      .isAlphanumeric(),
    body(
      "newPassword",
      "Please Password has to be atleast 6 characters and Alphanumeric"
    )
      .isLength({ min: 6 })
      .isAlphanumeric(),
  ],
  isAuth,
  updatePassword
);

router.post(
  "/reset",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),
  ],
  reset
);

router.get("/passwordreset/:token", passwordReset);

router.put("/resetpassword", resetPassword);

router.post(
  "/altreset",
  [
    body("phoneNumber")
      .trim()
      .not()
      .isEmpty()
      .withMessage("Please add a phone number")
      .isLength({ min: 13, max: 13 })
      .withMessage("Please provide a 12 digit number"),
  ],
  altReset
);

router.put(
  "/altresetpassword",
  [
    body("phoneNumber")
      .trim()
      .not()
      .isEmpty()
      .withMessage("Please add a phone number")
      .isLength({ min: 13, max: 13 })
      .withMessage("Please provide a 12 digit number"),
    body("verificationCode")
      .trim()
      .not()
      .isEmpty()
      .withMessage("Please add a verification code"),
    body("newPassword", "Please add a Password")
      .isLength({ min: 6 })
      .isAlphanumeric(),
  ],
  altResetPassword
);

export default router;
