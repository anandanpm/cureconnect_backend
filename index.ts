import express from 'express';
import dotenv from 'dotenv';
import connectDB from './Configs/db';
import cookieParser from 'cookie-parser';
import cors from "cors";
import userRoutes from './Route/userRoute';
import doctorRoute from './Route/doctorRoute';
import adminRoute from "./Route/adminRoute";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to Database
connectDB();

// Enable CORS
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true, 
}));

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/user', userRoutes);
app.use('/doctor',doctorRoute);
app.use('/admin',adminRoute);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
