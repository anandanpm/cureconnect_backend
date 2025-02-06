import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config()

class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  }

  async sendRejectionEmail(email: string, reason: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Curra_Connect: Doctor Application Rejected",
        text: `
          Dear Doctor,

          We regret to inform you that your application to join Curra_Connect has been rejected.

          Reason for rejection: ${reason}

          If you have any questions or would like to appeal this decision, please contact our support team at support@curra_connect.com.

          Thank you for your interest in Curra_Connect.

          Best regards,
          The Curra_Connect Team
        `,
      }

      await this.transporter.sendMail(mailOptions)
      return true
    } catch (error) {
      console.error("Rejection Email Error:", error)
      return false
    }
  }

  async sendApprovalEmail(email: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Curra_Connect: Doctor Application Approved",
        text: `
          Dear Doctor,

          Congratulations! Your application to join Curra_Connect has been approved.

          You can now log in to your account and start taking appointments. We're excited to have you on board and look forward to your valuable contributions to our platform.

          If you have any questions or need assistance getting started, please don't hesitate to contact our support team at support@curra_connect.com.

          Welcome to Curra_Connect!

          Best regards,
          The Curra_Connect Team
        `,
      }

      await this.transporter.sendMail(mailOptions)
      return true
    } catch (error) {
      console.error("Approval Email Error:", error)
      return false
    }
  }
}

export const emailService = new EmailService()

