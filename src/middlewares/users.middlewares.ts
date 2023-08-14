import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'

export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).send({
      message: 'Email and password are required'
    })
  }
  next()
}

export const registerValidator = checkSchema({
  name: {
    isString: true,
    isLength: {
      errorMessage: 'Name should be at least 2 chars long',
      options: { min: 2, max: 20 }
    },
    notEmpty: {
      errorMessage: 'Name is required'
    },
    trim: true
  },
  email: {
    isEmail: true,
    trim: true,
    notEmpty: true
  },
  password: {
    isString: true,
    notEmpty: true,
    isLength: {
      options: {
        min: 6,
        max: 20
      }
    },
    isStrongPassword: {
      options: {
        minLength: 6,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
      }
    }
  },
  confirm_password: {
    isString: true,
    notEmpty: true,
    isLength: {
      options: {
        min: 6,
        max: 20
      }
    },
    isStrongPassword: {
      options: {
        minLength: 6,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
      }
    },
    custom: {
      options: (value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match password')
        }
        return true
      }
    }
  },
  date_of_birth: {
    isISO8601: {
      options: {
        strict: true,
        strictSeparator: true
      }
    }
  }
})
