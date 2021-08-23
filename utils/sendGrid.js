import dotenv from "dotenv";
import nodemailer from "nodemailer";
import sendgridTransport from "nodemailer-sendgrid-transport";
dotenv.config();

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY,
    },
  })
);

async function sendEmail(options) {
  await transporter.sendMail(options);
}

export default sendEmail;
