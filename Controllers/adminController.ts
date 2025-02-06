import { Request, Response } from 'express';
import { adminService } from '../Services/adminService';


class AdminController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const { accessToken, refreshToken, username, email: adminEmail, role, isActive } = await adminService.login(email, password);

      res.cookie('accessToken', accessToken, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, 
      });

      res.cookie('refreshToken', refreshToken, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, 
      });

      res.json({ message: 'Admin login successful', username, email: adminEmail, role, isActive });
    } catch (error: any) {
      console.error("Admin Login Error:", error);
      res.status(401).json({ message: error.message });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      res.clearCookie('adminaccessToken');
      res.clearCookie('adminrefreshToken');
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

  async getPatients(req: Request, res: Response): Promise<void> {
   try {
    let response = await adminService.getPatients();
   res.status(200).json(response);
   } catch (error) {
    if(error instanceof Error)res.status(400).json({ message: error.message });
    else res.status(400).json({ message: 'An unknown error occurred' });
   }
}

async togglePatientStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const updatedPatient = await adminService.togglePatientStatus(id, is_active);
    res.status(200).json(updatedPatient);
  } catch (error) {
    console.error('Toggle Patient Status Error:', error);
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: 'An unknown error occurred' });
    }
  }
}

async getVerifyDoctors(req: Request, res: Response): Promise<void> {
  try {
    const doctors = await adminService.getVerifyDoctors();
    res.status(200).json(doctors);
  } catch (error) {
    console.error('Get Doctors Error:', error);
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: 'An unknown error occurred' });
    }
  }
}

async getDoctors(req:Request,res:Response):Promise<void>{
  try {
    const doctors = await adminService.getDoctors();
    res.status(200).json(doctors)

  } catch (error) {
    console.error('Get Doctors Error',error)
    if(error instanceof Error){
      res.status(400).json({message:error.message});
    }
    else{
      res.status(400).json({message:'An unknown error occured'})
    }
  }
}



async toggleDoctorStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const updatedDoctor = await adminService.toggleDoctorStatus(id);
    console.log(updatedDoctor,'the updateddoctor from the toggle')
    res.status(200).json(updatedDoctor);
  } catch (error) {
    console.error('Toggle Doctor Status Error:', error);
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: 'An unknown error occurred' });
    }
  }
}

async verifyDoctor(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const verifiedDoctor = await adminService.verifyDoctor(id);
    console.log(verifiedDoctor,'is there any  problem in this form the verifydoctor of the admin controller')
    res.status(200).json(verifiedDoctor);
  } catch (error) {
    console.error('Verify Doctor Error:', error);
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(400).json({ message: 'An unknown error occurred' });
    }
  }
}

async rejectDoctor(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { reason } = req.body

    await adminService.rejectDoctor(id, reason)

    res.status(200).json({ message: "Doctor rejected successfully" })
  } catch (error) {
    console.error("Error rejecting doctor:", error)
    res.status(500).json({ message: "An error occurred while rejecting the doctor" })
  }
}

}
export const adminController = new AdminController();

