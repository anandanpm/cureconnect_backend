import { Request, Response } from 'express';
import{doctorService} from '../Services/doctorService'


export class DoctorController {
  
    async getOtp(req: Request, res: Response): Promise<void> {
      try {
        const userData = req.body;
        const result = await doctorService.signup(userData);
        res.status(200).json(result);
      } catch (error: any) {
        console.error("Signup Error:", error);
        res.status(400).json({ message: error.message }); 
      }
    }
  
    async verifyOtp(req: Request, res: Response): Promise<void> {
      try {
        const { email, otp } = req.body;
        const result = await doctorService.verifyOtp(email, otp);
        res.status(200).json(result);
      } catch (error: any) {
        console.error("OTP Verification Error:", error);
        res.status(400).json({ message: error.message }); 
      }
    }
  
    async resendOtp(req: Request, res: Response): Promise<void> { 
      try {
        const { email } = req.body;
        if (!email) {
           res.status(400).json({ message: 'Email is required' });
           return
        }
  
        const result = await doctorService.resendOtp(email);
        res.status(200).json(result);
      } catch (error: any) {
        console.error("Resend OTP Error:", error);
        res.status(400).json({ message: error.message });
      }
    }
  
    async login(req: Request, res: Response): Promise<void> {
      try {
        const { email, password } = req.body;
        const {accessToken,refreshToken,username,Email,isActive,role,profile_pic,age,phone,certification,experience,department,medical_license,address,clinic_name,about,education,gender,_id} = await doctorService.login(email, password);
        
       console.log(username,'is the username is comming from there')
        res.cookie('accessToken', accessToken, { 
          secure: process.env.NODE_ENV === 'production', 
          sameSite: 'strict', 
          maxAge: 60 * 60 * 1000, 
          
        });
  
        res.cookie('refreshToken', refreshToken, {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, 
           
        });
  
        res.json({ message: 'Login successful',username,email:Email,role,isActive,profile_pic,age,phone,certification,experience,department,medical_license,address,clinic_name,about,gender,education,_id}); 
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
        const result = await doctorService.googleAuth(token);
        
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
          profile_pic:result.profile_pic,
          phone:result.phone,
          age:result.age,
          gender:result.gender,
          address:result.address,
          _id:result._id,
          experience:result.experience,
          certification:result.certification,
          department:result.department,
          medical_license:result.medical_license,
          clinic_name:result.clinic_name,
          about:result.about,
          education:result.education
        });
      } catch (error: any) {
        console.error("Google Auth Error:", error);
        res.status(400).json({ message: error.message }); 
      }
    }

    async updateProfile(req: Request, res: Response): Promise<void> {
        try {
          const docDetails = req.body;
          console.log('Incoming profile update request:', docDetails);
    
          const updatedDoc = await doctorService.profile(docDetails);
          console.log(updatedDoc,'the updated one is comming or not')
    
          res.status(200).json({ message: 'Profile updated successfully',updatedDoc });
        } catch (error) {
          console.error('Error updating profile:', error);
          res.status(500).json({ message: 'Internal server error'});
        }
      }

      async addSlots(req:Request,res:Response):Promise<void>{
        try {
          const slotData = req.body.slots;
          console.log('Incoming slot request:', req.body);
          const result = await doctorService.addSlots(slotData);
          res.status(200).json({message:'slot added successfully',result});

        } catch (error) {
          console.error('Error adding slots:', error);
          res.status(500).json({ message: 'Internal server error'});
        }
      }

      async getSlots(req:Request,res:Response):Promise<void>{
        try {
          const {doctorId} = req.params
          console.log(doctorId)
          const result  = await doctorService.getSlots(doctorId)
          res.status(200).json(result)
        } catch (error) {
          
        }
      }


      async getAppointment(req:Request,res:Response):Promise<void>{
        try {
          const { doctorId } = req.params;
          console.log(doctorId, 'the doctor id is coming');
          
          const appointments = await doctorService.getDoctorAppointments(doctorId);
          res.status(200).json(appointments);
        } catch (error) {
          console.error('Error fetching appointments:', error);
          res.status(500).json({ message: 'Failed to fetch appointments' });
        }
      }
  }

 

  export const doctorController = new DoctorController()