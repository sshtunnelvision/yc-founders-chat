const jwt = require('jsonwebtoken');
const fs = require('fs');

const privateKey = fs.readFileSync('/Users/arekhalpern/Code/soloprojects/2025/yc-founders-chat/keys/AuthKey_Y7Z594F4A9.p8');
const teamId = 'XF43SZ263Z';
const clientId = 'YOUR_SERVICES_ID';
const keyId = 'Y7Z594F4A9';

const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d', // Apple allows up to 6 months
  audience: 'https://appleid.apple.com',
  issuer: teamId,
  subject: clientId,
  keyid: keyId
});

console.log(token); // This is your client secret