export enum UserVerifyStatus {
  Unverified,
  Verified,
  Banned,
  Premium
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  EmailVerifiedToken
}

export enum MediaType {
  Video,
  Image
}

export enum TweetType {
  Tweet,
  Retweet,
  Comment,
  QuoteTweet
}

export enum TweetAudience {
  Everyone,
  TwitterCircle
}
