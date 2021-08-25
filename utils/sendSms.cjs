require("dotenv").config();
const credentials = {
  apiKey: process.env.AF_TALKING_KEY,
  username: process.env.AF_TALKING_USERNAME,
};
const AfricasTalking = require("africastalking")(credentials);

const sendSms = async (numbers, message) => {
  // Initialize a service e.g. SMS
  const sms = AfricasTalking.SMS;
  // Use the service
  const options = {
    to: numbers,
    message,
  };
  try {
    const smsResponse = await sms.send(options);
    return smsResponse;
  } catch (err) {
    return err;
  }
};

module.exports = sendSms;
