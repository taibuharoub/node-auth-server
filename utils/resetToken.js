import crypto from "crypto";
const generateToken = async () => {
  const buffer = await new Promise((resolve, reject) => {
    crypto.randomBytes(256, function (err, buffer) {
      if (err) {
        reject("error generating token");
      }
      resolve(buffer);
    });
  });
  const token = crypto.createHash("sha256").update(buffer).digest("hex");
  return token;
};

export default generateToken;
