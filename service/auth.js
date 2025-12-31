const jwt=require('jsonwebtoken');

// Use environment variable for JWT secret
const secretekey = process.env.JWT_SECRET || "abc@1234";

async function generateToken(user){
    const payload={
        id:user._id,
        email:user.email,
        role:user.role
    };

    const token=jwt.sign(payload, secretekey, {expiresIn: process.env.JWT_EXPIRES_IN || '1h'});
    return token;
}
async function verifyToken(token){
   if(!token) return null;
   return jwt.verify(token,secretekey);
}
module.exports= {generateToken, verifyToken};