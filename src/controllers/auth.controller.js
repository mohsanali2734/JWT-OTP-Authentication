import userModel from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import { sendEmail } from "../services/email.services.js";
import { generateOtp, getOtpHtml } from "../utils/utils.js";
import otpModel from "../models/otp.model.js";

const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
};

function hashValue(value) {
    return crypto.createHash("sha256").update(value).digest("hex");
}

export async function register(req, res) {
    try {
        const { username, email, password } = req.body || {};

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Username, email, and password are required"
            });
        }

        const isAlreadyRegistered = await userModel.findOne({
            $or: [{ username }, { email }]
        });

        if (isAlreadyRegistered) {
            return res.status(409).json({
                message: "Username or email already exists"
            });
        }

        const hashpassword = hashValue(password);

        const user = await userModel.create({
            username,
            email,
            password: hashpassword
        });

        const otp = generateOtp();
        const html = getOtpHtml(otp);
        const otpHash = hashValue(otp);

        await otpModel.create({
            email,
            user: user._id,
            otpHash
        });

        await sendEmail(email, "OTP Verification", `Your OTP code is ${otp}`, html);

        return res.status(201).json({
            message: "User registration successful",
            user: {
                username: user.username,
                email: user.email,
                verified: user.verified
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        if (!user.verified) {
            return res.status(401).json({
                message: "Email Not Verified"
            });
        }

        const hashedpassword = hashValue(password);
        const isValidpassword = hashedpassword === user.password;
        if (!isValidpassword) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const refreshToken = jwt.sign(
            { id: user._id },
            config.JWT_SECRET,
            { expiresIn: "7d" }
        );

        const refreshTokenHash = hashValue(refreshToken);

        const session = await sessionModel.create({
            user: user._id,
            refreshTokenHash,
            ip: req.ip || "unknown",
            userAgent: req.headers["user-agent"] || "unknown"
        });

        const accessToken = jwt.sign(
            { id: user._id, sessionId: session._id },
            config.JWT_SECRET,
            { expiresIn: "15m" }
        );

        res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

        return res.status(200).json({
            message: "Logged in successfully",
            user: {
                username: user.username,
                email: user.email
            },
            accessToken
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export async function getMe(req, res) {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Token not found"
            });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);

        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            message: "User fetched successfully",
            user: {
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(401).json({ message: "Invalid or expired access token" });
    }
}

export async function refreshToken(req, res) {
    try {
        const token = req.cookies?.refreshToken;

        if (!token) {
            return res.status(401).json({
                message: "Token not found"
            });
        }

        const decode = jwt.verify(token, config.JWT_SECRET);
        const refreshTokenHash = hashValue(token);

        const session = await sessionModel.findOne({
            refreshTokenHash,
            revoked: false
        });

        if (!session) {
            return res.status(401).json({
                message: "Invalid or revoked refresh token"
            });
        }

        const accessToken = jwt.sign(
            { id: decode.id, sessionId: session._id },
            config.JWT_SECRET,
            { expiresIn: "15m" }
        );

        const newRefreshToken = jwt.sign(
            { id: decode.id },
            config.JWT_SECRET,
            { expiresIn: "7d" }
        );

        session.refreshTokenHash = hashValue(newRefreshToken);
        await session.save();

        res.cookie("refreshToken", newRefreshToken, REFRESH_COOKIE_OPTIONS);

        return res.status(200).json({
            message: "Access token refreshed successfully",
            accessToken
        });
    } catch (error) {
        console.error(error);
        return res.status(401).json({ message: "Invalid or expired refresh token" });
    }
}

export async function logout(req, res) {
    try {
        const token = req.cookies?.refreshToken;

        if (!token) {
            return res.status(400).json({
                message: "Refresh token not found"
            });
        }

        const refreshTokenHash = hashValue(token);

        const session = await sessionModel.findOne({
            refreshTokenHash,
            revoked: false
        });

        if (session) {
            session.revoked = true;
            await session.save();
        }

        res.clearCookie("refreshToken", {
            httpOnly: REFRESH_COOKIE_OPTIONS.httpOnly,
            secure: REFRESH_COOKIE_OPTIONS.secure,
            sameSite: REFRESH_COOKIE_OPTIONS.sameSite
        });

        return res.status(200).json({
            message: "Logout successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export async function logoutAll(req, res) {
    try {
        const token = req.cookies?.refreshToken;

        if (!token) {
            return res.status(400).json({
                message: "Refresh token not found"
            });
        }

        const decode = jwt.verify(token, config.JWT_SECRET);

        await sessionModel.updateMany(
            {
                user: decode.id,
                revoked: false
            },
            {
                revoked: true
            }
        );

        res.clearCookie("refreshToken", {
            httpOnly: REFRESH_COOKIE_OPTIONS.httpOnly,
            secure: REFRESH_COOKIE_OPTIONS.secure,
            sameSite: REFRESH_COOKIE_OPTIONS.sameSite
        });

        return res.status(200).json({
            message: "Logout from all devices successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(401).json({ message: "Invalid or expired refresh token" });
    }
}

export async function verifyEmail(req, res) {
    try {
        const { otp, email } = req.body || {};

        if (!otp || !email) {
            return res.status(400).json({
                message: "OTP and email are required"
            });
        }

        const otpHash = hashValue(String(otp));

        const otpDoc = await otpModel.findOne({
            email,
            otpHash
        });

        if (!otpDoc) {
            return res.status(400).json({
                message: "Invalid or expired OTP"
            });
        }

        const user = await userModel.findByIdAndUpdate(
            otpDoc.user,
            { verified: true },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        await otpModel.deleteMany({
            user: otpDoc.user
        });

        return res.status(200).json({
            message: "Email verified successfully",
            user: {
                username: user.username,
                email: user.email,
                verified: user.verified
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}