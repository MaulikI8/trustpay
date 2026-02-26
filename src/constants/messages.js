const MESSAGES = {
  SUCCESS: "Operation successful.",
  INTERNAL_SERVER_ERROR: "Internal server error. Please try again later.",
  SOMETHING_WENT_WRONG: "Something went wrong.",
  VALIDATION_ERROR: "Validation error. Please check your inputs.",
  NOT_FOUND: "Resource not found.",
  DUPLICATE_ENTRY: "Duplicate entry found.",
  EMAIL_VERIFIED: "Email has been successfully verified",
  VERIFICATION_EMAIL_RESENT: "Verification email resent",

  VERIFICATION_SUCCESS: "Email verified successfully! You can now log in.",
  INVALID_TOKEN: "Invalid or expired verification token.",
  TOKEN_REQUIRED: "Verification token is required.",
  ALREADY_VERIFIED: "This email is already verified.",
  ERROR_GENERIC: "An error occurred during verification. Please try again later.",
  
  UNAUTHORIZED: "Unauthorized access. Please login first.",
  FORBIDDEN: "Access denied. You do not have permission.",
  TOKEN_NOT_PROVIDED: "Access denied. No token provided.",
  INVALID_TOKEN_FORMAT: "Access denied. Invalid token format.",
  INVALID_OR_EXPIRED_TOKEN: "Invalid or expired token.",
  
  LOGIN_SUCCESS: "Login successful.",
  REGISTER_SUCCESS: "Registration successful. Please verify your email.",
  OTP_SENT: "OTP sent successfully. Please check your email.",
  OTP_VERIFIED: "OTP verified successfully.",
  PASSWORD_RESET: "Password has been reset successfully.",
  PASSWORD_UPDATED: "Password updated successfully.",
  LOGOUT_SUCCESS: "Logged out successfully.",

  EMAIL_REQUIRED: "Email is required.",
  PASSWORD_REQUIRED: "Password is required.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  USER_NOT_FOUND: "User not found.",
  USER_ALREADY_EXISTS: "User already exists with this email.",
  ACCOUNT_LOCKED: "Your account has been locked. Please contact admin.",
  NO_OTP_FOUND: "No OTP request found for this user.",
  INVALID_OTP: "Invalid OTP code.",
  OTP_EXPIRED: "OTP has expired. Please request a new one.",
  OLD_PASSWORD_INCORRECT: "Old password is incorrect.",
  EMAIL_SEND_FAILED: "😂 Failed to send email. Please check server logs.",
  EMAIL_SENT: "✅ Email Sent to successfully.",

}

module.exports = MESSAGES;