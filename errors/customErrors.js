class CustomError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.name = this.constructor.name;
      this.statusCode = statusCode || 500;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  class BadRequestError extends CustomError {
    constructor(message = 'Bad Request') {
      super(message, 400);
    }
  }
  
  class NotFoundError extends CustomError {
    constructor(message = 'Not Found') {
      super(message, 404);
    }
  }
  
  // You can add more custom errors here as needed
  // For example:
  // class UnauthorizedError extends CustomError {
  //   constructor(message = 'Unauthorized') {
  //     super(message, 401);
  //   }
  // }
  // 
  // class ForbiddenError extends CustomError {
  //   constructor(message = 'Forbidden') {
  //     super(message, 403);
  //   }
  // }
  
  module.exports = {
    CustomError,
    BadRequestError,
    NotFoundError,
    // UnauthorizedError,
    // ForbiddenError
  };