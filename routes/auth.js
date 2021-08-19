import express from "express";
import { body } from "express-validator";

import { signup, login } from "../controllers/auth.js";
import User from "../models/User.js";

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
      .isLength({ min: 12, max: 12 })
      .withMessage("Please provide a 12 digit number"),
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

export default router;
