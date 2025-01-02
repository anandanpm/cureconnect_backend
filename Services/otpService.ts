import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config()

export class OtpService {
  static generateOTP(): string {
    return crypto.randomInt(1000, 9999).toString(); 
  }

  static generateOtpExpiration(): Date {
    return new Date(Date.now() + 1 * 60 * 1000); 
  }

  static async sendOTPEmail(email: string, otp: string,role:string): Promise<boolean> {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER||'curraconnect@gmail.com',
          pass: process.env.EMAIL_PASS||'cwqx gruj urea xvih',
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: role === 'patient' ? 'Curra_Connect: OTP for Secure Signup' : 'Curra_Connect: OTP for Doctor Signup', // Differentiate subject based on role
        text: `
            Dear ${role === 'patient' ? 'User' : 'Doctor'},
            
            Thank you for choosing Curra_Connect, your trusted partner for online consultations and appointments.
            
            Your One-Time Password (OTP) for completing the signup process is: ${otp}. 
            Please use this OTP to verify your account. Note that the OTP will expire in 10 minutes for your security.
            
            If you did not initiate this request, please ignore this email or contact our support team at support@curra_connect.com.
            
            We’re excited to have you on board and look forward to serving your healthcare needs.
            
            Best regards,
            The Curra_Connect Team
        `,
    };

    await transporter.sendMail(mailOptions);
    return true;
} catch (error) {
    console.error('OTP Email Error:', error);
    return false;
}

  }

  static validateOTP(storedOtp: string, storedExpiration: Date, userProvidedOtp: string): boolean {
    console.log(storedOtp,'storedOtp is comming and there is no problem')
    console.log(userProvidedOtp,'console.loging the userProvided Otp')
    if (storedOtp !== userProvidedOtp) {
      return false;
    }
    if (new Date() > storedExpiration) {
      return false;
    }
    return true;
  }

  // static async sendDocOTPEmail(email: string, otp: string,role:string): Promise<boolean> {
  //   try {
  //     const transporter = nodemailer.createTransport({
  //       service: 'gmail',
  //       auth: {
  //         user: process.env.EMAIL_USER||'curraconnect@gmail.com',
  //         pass: process.env.EMAIL_PASS||'cwqx gruj urea xvih',
  //       },
  //     });

  //     const mailOptions = {
  //       from: process.env.EMAIL_FROM,
  //       to: email,
  //       subject: 'Curra_Connect: OTP for Secure Signup',
  //       text: `
  //         Dear Doctor,
      
  //         Thank you for choosing Curra_Connect, your trusted partner for online consultations and appointments.
      
  //         Your One-Time Password (OTP) for completing the signup process is: ${otp}. 
  //         Please use this OTP to verify your account. Note that the OTP will expire in 10 minutes for your security.
      
  //         If you did not initiate this request, please ignore this email or contact our support team at support@curra_connect.com.
      
  //         We’re excited to have you on board and look forward to serving your healthcare needs.
      
  //         Best regards,
  //         The Curra_Connect Team
  //       `,
  //     };
      

  //     await transporter.sendMail(mailOptions);
  //     return true;
  //   } catch (error) {
  //     console.error('OTP Email Error:', error);
  //     return false;
  //   }
  // }
}