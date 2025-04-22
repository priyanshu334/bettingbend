const validatePhone = (phone) => {
    return /^\d{10}$/.test(phone);
  };
  
  const validatePassword = (password) => {
    return password.length >= 8 && 
           /\d/.test(password) && 
           /[!@#$%^&*]/.test(password);
  };
  
  const validateAmount = (amount) => {
    return typeof amount === 'number' && 
           amount > 0 && 
           amount <= Number.MAX_SAFE_INTEGER;
  };
  
  module.exports = {
    validatePhone,
    validatePassword,
    validateAmount
  };