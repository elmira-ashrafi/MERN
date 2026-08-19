import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, text, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.GOOGLE_APP_PASSWORD, // for sending mail using google, shoud create an app and use app password instead of normal password
      },
    });

    await transporter.verify();

    return await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    return null;
  }
};
