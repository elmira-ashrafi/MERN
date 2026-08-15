/*
 * Grants the Admin role to an existing account.
 *
 *   node scripts/makeAdmin.js someone@example.com
 *
 * Deliberately a script and not an endpoint: promoting an admin should require shell access
 * to the server, never a request anyone could reach.
 */

import path from "path"
import dotenv from "dotenv"
import mongoose from "mongoose"
import { serverRoot } from "../config/paths.js"
import User from "../models/user.js"

dotenv.config({ path: path.join(serverRoot, ".env") });

const email = process.argv[2];

if(!email) {
    console.error("usage: node scripts/makeAdmin.js <email>");
    process.exit(1);
}

if(!process.env.MONGODB) {
    console.error("MONGODB is not set");
    process.exit(1);
}

try {
    await mongoose.connect(process.env.MONGODB);

    const user = await User.findOne({email: email.trim().toLowerCase()}).exec();

    if(!user) {
        console.error(`no account found for ${email}`);
        process.exit(1);
    }

    if(user.role.includes("Admin")) {
        console.log(`${user.email} is already an admin`);
    } else {
        user.role.push("Admin");
        await user.save();
        console.log(`${user.email} is now an admin (roles: ${user.role.join(", ")})`);
        console.log("sign out and back in for the change to reach the browser");
    }

} catch (err) {
    console.error("failed:", err.message);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
