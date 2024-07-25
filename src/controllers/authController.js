const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const generateUsername = require('../utils/generateUsername');
const Epin = require('../models/Epin')
const Transaction = require('../models/Transaction');
const MlmStructure = require('../models/MlmStructure');
const Otp = require('../models/otpModel');
const fetch = require('node-fetch');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Register a new user


const findAvailableSponsor = async (referralCode) => {
  const sponsor = await User.findOne({ username: referralCode });
  if (!sponsor) return null;
  return findNextAvailableSponsor(sponsor._id);
};

// Function to check if the current user can accept new referrals
const canAcceptNewReferrals = async (userId) => {
  const count = await User.countDocuments({ sponsorId: Object(userId) });
  return count < 3; // Assuming each user can have up to 3 direct referrals
};

// Breadth-first search to find the next available sponsor
const findNextAvailableSponsor = async (userId) => {
  const queue = [userId];
  while (queue.length > 0) {
    const currentUserId = queue.shift();
    if (await canAcceptNewReferrals(currentUserId)) {
      return User.findById(currentUserId);
    }
    const children = await User.find({ sponsorId: currentUserId }, { _id: 1 });
    for (const child of children) {
      queue.push(child._id);
    }
  }
  return null;
};


exports.registerUser = async (req, res) => {
  const { email, password, mobileNumber, bankDetails, upiNumber, sponsorUsername,ePinId,name } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(200).json({ status:400,message: 'User already exists' });
  }

  const epin = await Epin.findOne({ ePinId, status: 'unused',type:"login" });
  if (!epin) {
    return res.status(200).json({ status:400,message: 'Invalid or already used E-pin' });
  }

  let sponsorId = null;
  if (sponsorUsername) {
    const sponsorUser = await findAvailableSponsor(sponsorUsername);
    if (!sponsorUser) {
      return res.status(200).json({ status:400,message: 'No available sponsor found for the provided referral code.' });
    }
    sponsorId = sponsorUser._id;
  }

  const sounseruserId = await User.findOne({ username:sponsorUsername });

  const username = await generateUsername();


  const user = await User.create({
    username,
    email,
    name,
    password,
    mobileNumber,
    bankDetails,
    upiNumber,
    referralCode:sponsorUsername,
    sponsorId
  });

  if (user) {
        // Calculate commissions
        let currentLevel = 1;
        let currentUserId = sponsorId;
        const amount = 1000; // Assuming this is the joining amount, adjust as per your logic
        const transactions = [];
        const mlmStructures = [];
  
        while (currentLevel <= 10) {
          const sponsor = await User.findById(currentUserId);
          const commissionAmount = amount * currentLevel;

          if (sponsor) {

            if (user.sponsorId == sounseruserId._id) {
              transactions.push({
                payerId: user._id, // The new user pays commission
                receiverId: sponsor._id, // Sponsor receives commission
                amount: commissionAmount,
                type: 'commission',
                level: currentLevel
              }); 
            }else{
              if(currentLevel==1){
                transactions.push({
                  payerId: user._id, // The new user pays commission
                  receiverId: sounseruserId._id, // Sponsor receives commission
                  amount: commissionAmount,
                  type: 'commission',
                  level: currentLevel
                });
              }else{
                transactions.push({
                  payerId: user._id, // The new user pays commission
                  receiverId: sponsor._id, // Sponsor receives commission
                  amount: commissionAmount,
                  type: 'commission',
                  level: currentLevel
                });
              }
            }

            mlmStructures.push({
              userId: user._id,
              level: currentLevel,
              uplineId: sponsor._id
            });
  
            currentUserId = sponsor.sponsorId; // Move to the next upline
          } else {
            transactions.push({
              payerId: user._id, // The new user pays commission
              receiverId: Object("66973cc83079a2d915bce430"), // Default commission receiver
              amount: commissionAmount,
              type: 'commission',
              level: currentLevel
            });
            
            // Break the loop since there's no valid upline user
            currentUserId = null;
          }
  
          currentLevel++;
        }
  
        // Create transactions and MLM structures in bulk
        await Transaction.insertMany(transactions);
        await MlmStructure.insertMany(mlmStructures);
  
// Mark E-pin as used    
    epin.status = 'used';
    epin.usedBy = user._id;
    await epin.save();

    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: 'Bearer sNZxqze0Bb2JxCuujKyd8qRzTWKmIgrESdebgvn554fd9318'
      },
      body: JSON.stringify({chatId: "91"+user.mobileNumber+'@c.us', 
        message: `*Welcome to MagicHelp, ${user.name}!* 🎉\n\nThank you for registering with us. We are thrilled to have you join our community. Here is your user Name : *${user.username}*.\n\nIf you have any questions or need assistance, feel free to reach out.\n\nBest Regards,\n*MagicHelp Team*`
      })
    };
    fetch('https://waapi.app/api/v1/instances/15895/client/action/send-message', options)
      .then(response => response.json())
      .then(response => response.json())
      .catch(err => console.error(err));
    
    res.status(200).json({
      status:200,
      _id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      token: generateToken(user._id)
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

exports.checkUser = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ name: user.name });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Authenticate user and get token
exports.authUser = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      token: generateToken(user._id)
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      mobileNumber: user.mobileNumber,
      name: user.name,
      bankDetails: user.bankDetails,
      upiNumber: user.upiNumber,
      referralCode: user.referralCode,
      sponsorId: user.sponsorId
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  const user = await User.findById(req.body._id);
  if (user) {
    user.email = req.body.email || user.email;
    user.mobileNumber = req.body.mobileNumber || user.mobileNumber;
    user.upiNumber = req.body.upiNumber || user.upiNumber;
    user.name = req.body.name || user.name;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      status:200,
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      token: generateToken(updatedUser._id)
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};



const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
};


exports.genrateOtp = async (req, res) => {
  try {
    const {phoneNumber,username} = req.params;
    const user = await User.findOne({mobileNumber: phoneNumber,username:username})
    if (!user) {
      res.status(404).json({message:"Account Not Found"})
    }

    const otpValue = generateOtp();
    const otp = await Otp.create({phoneNumber:user.mobileNumber,otp:otpValue,username:user.username})
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: 'Bearer sNZxqze0Bb2JxCuujKyd8qRzTWKmIgrESdebgvn554fd9318'
      },
      body: JSON.stringify({chatId: "91"+user.mobileNumber+'@c.us', message: 'Your MagicHelp forget Password Otp is '+ otp.otp})
    };
    fetch('https://waapi.app/api/v1/instances/15895/client/action/send-message', options)
      .then(response => response.json())
      .then(response => response.json())
      .catch(err => console.error(err));

    res.status(200).json({success:200,message: "Otp Send SuccessFully"})  
  } catch (error) {
    console.error('Error generating OTP:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


exports.veryfyOtpAndChangePassword = async (req, res) => {
  const { password,otpnumber } = req.body
  try {
    const otp = await Otp.findOne({ otp:otpnumber })
    if(!otp){
      res.status(200).json({ status:400,message: "Invalid OTP" });
    }
    const user = await User.findOne({mobileNumber: otp.phoneNumber,username:otp.username})
    if(!user){
      res.status(200).json({ status:400,message: "Invalid User" });
    }
    user.password = password
    user.save()
    await Otp.deleteOne({ otp: otpnumber });
    res.status(200).json({ status:200,message: "Password Changed Successfully" });
  } catch (error) {
    console.error('Error generating OTP:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
