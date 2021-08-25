export const generateVerificationCode = async (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
