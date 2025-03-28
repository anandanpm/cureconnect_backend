
import { Server } from "socket.io";
import http from "http";

const initWebSocket = (server: http.Server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("User connected", socket.id);

        socket.on("joinChat", (userId: string) => {
            console.log(`User ${userId} joined their room`);
            socket.join(userId); 
        });

        socket.on("sendMessage", (data) => {
            io.to(data.receiverId).emit("receiveMessage", data); 
        });

        socket.on("callNotification", (data) => {
            console.log(`Doctor ${data.doctorName} started call for patient ${data.userId}`);
            io.emit("callNotificationemit", data);  
            console.log(`Emitting callNotificationemit to user ${data.userId}`);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected");
        });
    });

    return io;
};

export default initWebSocket;



