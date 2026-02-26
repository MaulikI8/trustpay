const { z } = require('zod');

const nepaliPhoneRegex = /^\+977-?9\d{9}$/;

const normalizePhone = (phone) => {
  if (phone.startsWith('+977-')) return phone;       
  return phone.replace('+977', '+977-');             
};

const registerSchema = z.object({
  full_name: z.string().min(3, "Full name must be at least 3 characters long"),
  email: z.string().email("Invalid email format"),
  phone: z.string()
    .regex(nepaliPhoneRegex, "Phone must be a valid Nepal number: +977-9814283778")
    .transform(normalizePhone),
  security_pin: z.string().length(4, "Security PIN must be exactly 4 digits").regex(/^\d{4}$/, "PIN must be 4 numbers only"),
  re_security_pin: z.string()
}).refine((data) => data.security_pin === data.re_security_pin, {
  message: "Security PIN and Re-Security PIN do not match",
  path: ["re_security_pin"]
});

const loginSchema = z.object({
  phone: z.string()
    .regex(nepaliPhoneRegex, "Phone must be a valid Nepal number: +977-9814283778")
    .transform(normalizePhone),
  security_pin: z.string().length(4, "Security PIN must be 4 digits").regex(/^\d{4}$/, "PIN must be 4 numbers only")
});

module.exports = { registerSchema, loginSchema };