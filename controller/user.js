const user=require('../models/user');
const { generateToken,verifyToken } = require('../service/auth');

async function signup(req, res) {
   const {fullname, email, password}=req.body;
   await user.create({fullname, email, password});
    res.redirect('/signin');

};
async function signin(req, res) {
   const {email, password}=req.body;
   console.log(email, password);
   const u= await user.matchPassword(email, password);
   console.log(u);
   const token= await generateToken(u);
   console.log("Generated Token:", token);
   res.cookie('token', token).redirect('/');
};



module.exports = { signup, signin };