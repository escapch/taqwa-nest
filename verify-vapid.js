const webpush = require('web-push');
require('dotenv').config();

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

console.log('Checking VAPID keys...');
console.log('Public Key:', publicKey);
console.log('Private Key:', privateKey ? '***PRESENT***' : 'MISSING');
console.log('Subject:', subject);

try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    console.log('SUCCESS: VAPID keys are valid!');
} catch (error) {
    console.error('ERROR: VAPID keys are invalid:', error.message);
}
