interface CredentialType {
  code: string;
  type: string;
}

interface CredentialRequestOptions {
  otp: OTPOptions;
}

interface OTPOptions {
  transport: string[];
}
