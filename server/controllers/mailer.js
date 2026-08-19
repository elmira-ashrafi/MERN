import { sendEmail } from "../utils/mailer.js";
import User from "../models/user.js";
import { nanoid } from "nanoid";
import { hashPassword } from "../utils/auth.js";

const RESET_CODE_TTL_MS = 15 * 60 * 1000;

export const sendCodeToEmail = async (req, res, next) => {
  // the same answer whether or not the address exists, so this cannot be used to enumerate users
  const response = "we have sent an email if the address exists.";

  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res
        .status(400)
        .json({ ok: false, message: "please enter your email" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).exec();

    if (!user) {
      return res.status(200).json({ ok: true, message: response });
    }

    const code = nanoid(6);

    const html = `
            <div>
                <h2>please copy the code below and send it for us to reset your password \n</h2>
                <p><strong>${code}</strong></p>
                <p>this code expires in 15 minutes</p>
                <p>do nothing if you didn't send this request</p>
            </div>
        `;

    const info = await sendEmail(
      normalizedEmail,
      "reset password code from my app",
      `your reset code is ${code}`,
      html,
    );
    // the previous code stays valid unless this one actually went out
    if (!info || !info.accepted?.length) {
      return res
        .status(500)
        .json({ ok: false, message: "something went wrong! please try again" });
    }

    const token = await hashPassword(code);

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetCode: token,
          passwordResetExpires: new Date(Date.now() + RESET_CODE_TTL_MS),
          passwordResetAttempts: 0,
        },
      },
    ).exec();

    return res.status(200).json({ ok: true, message: response });
  } catch (err) {
    return next(err);
  }
};
