const jwt = require('jsonwebtoken');
const fs = require('fs');

// Usage: node generate-apple-secret.js <team_id> <service_id> <key_id> <path_to_private_key_file>
// Example: node generate-apple-secret.js A1B2C3D4E5 com.example.app.service 9876543210 ./AuthKey_9876543210.p8

const args = process.argv.slice(2);

if (args.length !== 4) {
    console.error('Usage: node generate-apple-secret.js <team_id> <service_id> <key_id> <path_to_private_key_file>');
    process.exit(1);
}

const [teamId, serviceId, keyId, privateKeyPath] = args;

try {
    const privateKey = fs.readFileSync(privateKeyPath);

    const token = jwt.sign({}, privateKey, {
        algorithm: 'ES256',
        expiresIn: '180d', // 6 months (max allowed by Apple)
        audience: 'https://appleid.apple.com',
        issuer: teamId,
        subject: serviceId,
        keyid: keyId,
    });

    console.log('\n✅ Generated Apple Client Secret (valid for 6 months):\n');
    console.log(token);
    console.log('\n📋 Copy this JWT and paste it into the "Client Secret" field in Supabase Dashboard -> Auth -> Providers -> Apple');

} catch (error) {
    console.error('Error generating token:', error.message);
    if (error.code === 'ENOENT') {
        console.error('Make sure the private key file path is correct.');
    } else if (error.message.includes('PEM')) {
        console.error('The private key file does not appear to be in a valid format (PEM/p8).');
    }
}
