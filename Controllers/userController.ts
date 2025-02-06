import { Request, Response } from 'express';
import { userService } from '../Services/userService';

export class UserController {
  
  async getOtp(req: Request, res: Response): Promise<void> {
    try {
      const userData = req.body;
      const result = await userService.signup(userData);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Signup Error:", error);
      res.status(400).json({ message: error.message }); 
    }
  }

  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otpString } = req.body;
      console.log(email)
      const result = await userService.verifyOtp(email, otpString);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("OTP Verification Error:", error);
      res.status(400).json({ message: error.message }); 
    }
  }

  async resendOtp(req: Request, res: Response): Promise<void> { 
    try {
      console.log(req.body)
      const { email } = req.body;
      console.log(email,'the email is comming')
      if (!email) {
         res.status(400).json({ message: 'Email is required' });
         return
      }

      const result = await userService.resendOtp(email);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Resend OTP Error:", error);
      res.status(400).json({ message: error.message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const {accessToken,refreshToken,username,Email,role,isActive,_id,gender,profile_pic,phone,age,address} = await userService.login(email, password);

      res.cookie('accessToken', accessToken, { 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 60 * 60 * 1000, 
        path: '/'
        
      });

      res.cookie('refreshToken', refreshToken, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, 
        path: '/'
         
      });

      res.json({ message: 'Login successful',username,email:Email,role,isActive,_id,age,gender,profile_pic,phone,address});   
    } catch (error: any) {
      console.error("Login Error:", error);
      res.status(401).json({ message: error.message });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.json({ message: 'Logout successfully' });
    } catch (error) {
      console.error('Logout Error:', error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: 'An unknown error occurred' });
      }
    }
  }

  async googleAuth(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;
      const result = await userService.googleAuth(token);
      
      res.cookie('accessToken', result.accessToken, { 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 60 * 60 * 1000, 
        path: '/'
      });

      res.cookie('refreshToken', result.refreshToken, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, 
        path: '/'
      });

      res.status(200).json({ 
        message: 'Google authentication successful',
        username: result.username,
        email: result.email,
        role: result.role,
        isActive: result.isActive,
        gender:result.gender,
        profile_pic:result.profile_pic,
        phone:result.phone,
        age:result.age,
        address:result.address,
        _id:result._id
      });
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      res.status(400).json({ message: error.message }); 
    }
  }
 
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userDetails = req.body;
      console.log('Incoming profile update request:', userDetails);

      const updatedUser = await userService.profile(userDetails);

      res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Internal server error'});
    }
  }

  async getDoctors(req: Request, res: Response): Promise<void> {
    try {
      const doctors = await userService.getDoctors();
      res.status(200).json(doctors);
    } catch (error: any) {
      console.error('Error fetching doctors:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async doctorSlots(req: Request, res: Response): Promise<void> {
    try {
      const doctorId =  req.params.id
      const slots = await userService.getDoctorSlots(doctorId)
      res.status(200).json(slots)
    } catch (error: any) {
      console.error("Error fetching doctor slots:", error)
      if (error.message === "Doctor not found") {
        res.status(404).json({ message: "Doctor not found" })
      } else {
        res.status(500).json({ message: "Internal server error" })
      }
    }
  }

  async createPaymentIntent(req: Request, res: Response): Promise<void> {
    try {
      const { userId,amount } = req.body
      const clientSecret = await userService.createPaymentIntent(amount)
      console.log(clientSecret,'is this creating')
      res.status(200).json({ clientSecret })
    } catch (error: any) {
      console.error("Payment Intent Error:", error)
      res.status(400).json({ message: error.message })
    }
  }

  async createAppointment(req: Request, res: Response): Promise<void> {
    try {
      console.log(req.body)
      const appointmentData = {
        slot_id: req.body.slotId,
        user_id: req.body.userId,
        amount: req.body.amount,
        payment_id:req.body.paymentId,
        status: 'pending'
      };
  
      const result = await userService.createAppointment(appointmentData);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(500).json({ message: 'Failed to create appointment' });
    }
  }


  async appointmentDetails(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id
      console.log(req.params,'is this comming')
      console.log(userId, "the userId is coming from params")

      const appointmentDetails = await userService.getAppointmentDetails(userId)

    console.log(appointmentDetails,'the details are comming ')

      res.status(200).json(appointmentDetails)
    } catch (error) {
      console.error("Error in appointmentDetails:", error)
      if (error instanceof Error && error.message === "No appointment found for this user") {
        res.status(404).json({ message: "No appointment found for this user" })
      } else {
        res.status(500).json({ message: "Internal server error" })
      }
    }
  }

  async refundPayment(req:Request,res:Response):Promise<void>{
    try {
      console.log(req.body,'the body is comming and correct')
      const {appointmentId }= req.body
      const result = await userService.refundPayment(appointmentId)
      res.status(200).json({result})
    } catch (error) {
      console.log(error)
      res.status(500).json({message:'Internal server error'})
    }
  }
  
}


export const userController = new UserController();