"use strict";
// import { Server } from "socket.io";
// import http from "http";
Object.defineProperty(exports, "__esModule", { value: true });
// const initWebSocket = (server: http.Server) => {
//     const io = new Server(server, {
//         cors: {
//             origin: process.env.FRONTEND_URL,
//             credentials: true,
//         },
//     });
//     io.on("connection", (socket) => {
//         console.log("User connected", socket.id);
//         socket.on("joinChat", (userId: string) => {
//             console.log(`User ${userId} joined their room`);
//             socket.join(userId); 
//         });
//         socket.on("sendMessage", (data) => {
//             io.to(data.receiverId).emit("receiveMessage", data); 
//         });
//         socket.on("callNotification", (data) => {
//             console.log(`Doctor ${data.doctorName} started call for patient ${data.userId}and the room id is ${data.roomId}`);
//             io.emit("callNotificationemit", data);  
//             console.log(`Emitting callNotificationemit to user ${data.userId}`);
//         });
//         socket.on("disconnect", () => {
//             console.log("User disconnected");
//         });
//     });
//     return io;
// };
// export default initWebSocket;
const socket_io_1 = require("socket.io");
const initWebSocket = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            credentials: true,
        },
    });
    io.on("connection", (socket) => {
        console.log("User connected", socket.id);
        socket.on("joinChat", (userId) => {
            console.log(`User ${userId} joined their room`);
            socket.join(userId);
        });
        socket.on("sendMessage", (data) => {
            io.to(data.receiverId).emit("receiveMessage", data);
        });
        socket.on("callNotification", (data) => {
            console.log(`Doctor ${data.doctorName} started call for patient ${data.userId} and the room id is ${data.roomId}`);
            // Emit to specific user's room instead of broadcasting to everyone
            io.to(data.userId).emit("callNotificationemit", data);
            console.log(`Emitting callNotificationemit to user ${data.userId}`);
        });
        socket.on("callAccepted", (data) => {
            console.log(`Call accepted by patient ${data.userId} for room ${data.roomId}`);
            // Notify doctor that call was accepted
            io.to(data.doctorId).emit("callAccepted", data);
        });
        socket.on("callDeclined", (data) => {
            console.log(`Call declined by patient ${data.userId}`);
            // Notify doctor that call was declined
            io.to(data.doctorId).emit("callDeclined", data);
        });
        socket.on("disconnect", () => {
            console.log("User disconnected");
        });
    });
    return io;
};
exports.default = initWebSocket;
