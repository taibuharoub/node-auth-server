import mongoose from "mongoose";
import uniqueValidator from "mongoose-unique-validator";

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Please add a phone number"],
      unique: true,
      minlength: 13,
      maxlength: 13,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    status: {
      type: Number,
      enum: [1, 0],
      default: 1, // 1 = Active, 0 = Deactive
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    verificationCode: String,
    verificationCodeExpiration: Date,
  },
  { timestamps: true }
);
userSchema.plugin(uniqueValidator);
export default mongoose.model("User", userSchema);
