const User = require('../models/User');

const generateUsername = async () => {
  let username;
  let userExists;

  do {
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    username = `MH${randomNumber}`;
    userExists = await User.findOne({ username });
  } while (userExists);

  return username;
};

module.exports = generateUsername;
