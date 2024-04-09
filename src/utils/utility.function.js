const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT } = require("../config/config");

const crypto = require("crypto");

const generateRandomPassword = (length) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[]|;:,.<>?";
  let password = "";

  for (let i = 0; i < length; ++i) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }

  return password;
};

const checkPassword = (password, passwordHash) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, passwordHash, (err, same) => {
      if (err) {
        reject(err);
      }

      resolve(same);
    });
  });
};

const newToken = (id,userRole) => {
  return jwt.sign({ id: id,role:userRole }, JWT.jwt, {
    expiresIn: JWT.jwtExp,
  });
};

const verifyToken = (token) =>
  new Promise((resolve, reject) => {
    jwt.verify(token, JWT.jwt, (err, payload) => {
      if (err) return reject(err);
      resolve(payload);
    });
  });

module.exports = {
  checkPassword,
  newToken,
  verifyToken,
  generateRandomPassword,
};
