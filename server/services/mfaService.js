import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export const generateMfaSecret = (userEmail) => {
  const secret = speakeasy.generateSecret({
    name: `MA-ON Financial (${userEmail})`,
    length: 20,
  });

  return {
    otpauthUrl: secret.otpauth_url,
    base32Secret: secret.base32,
  };
};

export const generateQrCodeUrl = async (otpauthUrl) => {
  return await QRCode.toDataURL(otpauthUrl);
};

export const verifyMfaToken = (token, base32Secret) => {
  return speakeasy.totp.verify({
    secret: base32Secret,
    encoding: 'base32',
    token: token,
    window: 1, // Allow 30 seconds drift
  });
};
