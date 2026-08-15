import bcrypt from "bcrypt"

export const hashPassword = password => bcrypt.hash(password, 12); 

export const comparePasswords = (password, hashed) => bcrypt.compare(password, hashed);