export const USERS_MESSAGES = {
  VALIDATION_ERROR: 'Validation Error',
  NAME_IS_REQUIRED: 'Name is required',
  NAME_MUST_BE_A_STRING: 'Name must be a string',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  NAME_LENGTH: 'Name length must be from 1 to 100',
  EMAIL_IS_REQUIRED: 'Email is required',
  EMAIL_OR_PASSWORD_INCORRECT: 'Email or password is incorrect',
  EMAIL_IS_INVALID: 'Email is invalid',
  PASSWORD_IS_REQUIRED: 'Password is required',
  PASSWORD_MUST_BE_A_STRING: 'Password must be a string',
  PASSWORD_LENGTH_FROM_6_TO_20: 'Password must be from 6 to 20 character',
  PASSWORD_MUST_BE_STRONG:
    'Password must be from 6 to 20 characters long and contain at least 1 lowercase, 1 uppercase, 1 number and 1 symbol',
  CONFIRM_PASSWORD_IS_REQUIRED: 'Confirm password must be required',
  CONFIRM_PASSWORD_MUST_BE_A_STRING: 'Confirm password must be a string',
  REGISTER_SUCCESS: 'Register Success',
  LOGIN_SUCCESS: 'Login Success'
} as const
