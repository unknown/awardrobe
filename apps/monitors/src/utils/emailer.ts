import nodemailer from "nodemailer";

const emailTransporter = nodemailer.createTransport(process.env.EMAIL_SERVER!);

export default emailTransporter;
