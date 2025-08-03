import sendEmail from '../config/sendEmail.js';
import UserModel from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import verifyEmailTemplate from '../utils/verifyEmailTemplate.js';
import generatedAccessToken from '../utils/generatedAccessToken.js';
import generateRefreshToken from '../utils/generateRefreshToken.js';
import uploadImageCloudinary from '../utils/uploadImageCloudinary.js';
import generatedOTP from '../utils/generatedOTP.js';
import forgotPasswordTemplate from '../utils/forgotPasswordTemplate.js';
import jwt from 'jsonwebtoken';

// register controller
export const registerUserController = async (req, res) => {
  try {
    // Destructuring
    const { name, email, password } = req.body;

    // Check if all fields are filled in
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'All fields must be filled in',
        error: true,
        success: false,
      });
    }

    // Check if 'email' exist
    const user = await UserModel.findOne({ email });
    if (user) {
      return res.json({
        message: 'This email is already in use',
        error: true,
        success: false,
      });
    }

    // Hashing the password before saving it to the DB
    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(password, salt);

    const payload = {
      name,
      email,
      password: hashPassword,
    };

    // Saving all data in the DB
    const newUser = new UserModel(payload);
    const save = await newUser.save();

    // Account verification via email address
    const verifyEmailUrl = `${process.env.FRONTEND_URI}/verify-email?code=${save?._id}`;

    const verifyEmail = await sendEmail({
      sendTo: email,
      subject: 'Verify email from Binkeyit',
      html: verifyEmailTemplate({
        name,
        url: verifyEmailUrl,
      }),
    });

    return res.json({
      message: 'User registered successfully. Please verify your email.',
      error: false,
      success: true,
      data: save,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

// verify email
export const verifyEmailController = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await UserModel.findOne({ _id: code });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid code',
        error: true,
        success: false,
      });
    }
    const updateUser = await UserModel.updateOne(
      { _id: code },
      {
        verify_email: true,
      },
    );

    return res.json({
      message: 'Verify email done',
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

// login controller
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required!',
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: 'User not registered',
        error: true,
        success: false,
      });
    }

    if (user.status !== 'Active') {
      return res.status(400).json({
        message: 'Contact to Admin',
        error: true,
        success: false,
      });
    }

    const checkPassword = await bcryptjs.compare(password, user.password);
    if (!checkPassword) {
      return res.status(400).json({
        message: 'Wrong password',
        error: true,
        success: false,
      });
    }

    const accessToken = await generatedAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

    const updateUser = await UserModel.findByIdAndUpdate(user?._id, {
      last_login_date: new Date(),
    });

    const cookieOption = {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
    };

    res.cookie('accessToken', accessToken, cookieOption);
    res.cookie('refreshToken', refreshToken, cookieOption);
    return res.json({
      message: 'Login successfully',
      error: false,
      success: true,
      data: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

// logout controller
export const logoutController = async (req, res) => {
  try {
    const userid = req.userId;
    const cookieOption = {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
    };

    res.clearCookie('accessToken', cookieOption);
    res.clearCookie('refreshToken', cookieOption);

    const removeRefreshToken = await UserModel.findByIdAndUpdate(userid, {
      refresh_token: '',
    });

    return res.json({
      message: 'Logout successfully',
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

// upload user avatar
export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.userId; // auth middleware
    const image = req.file; // multer middleware

    const upload = await uploadImageCloudinary(image);

    const updeteUser = await UserModel.findByIdAndUpdate(userId, {
      avatar: upload.url,
    });
    return res.json({
      message: 'upload profile',
      error: false,
      success: true,
      data: {
        _id: userId,
        avatar: upload.url,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

// update user details
export const updateUserDetails = async (req, res) => {
  try {
    const userId = req.userId; // auth middleware
    const { name, email, mobile, password } = req.body;

    let hashPassword = '';
    if (password) {
      const salt = await bcryptjs.genSalt(10);
      hashPassword = await bcryptjs.hash(password, salt);
    }
    const updateUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        ...(name && { name: name }),
        ...(email && { email: email }),
        ...(mobile && { mobile: mobile }),
        ...(password && { password: hashPassword }),
      },
      { new: true },
    );

    return res.json({
      message: 'Updated successfully',
      error: false,
      success: true,
      data: updateUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

// forgot password (not login)
export const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: 'Email is not available',
        error: true,
        success: false,
      });
    }

    const otp = generatedOTP();
    const expireTime = new Date(Date.now() + 60 * 60 * 1000); // 1hr

    const update = await UserModel.findByIdAndUpdate(user._id, {
      forgot_password_otp: otp,
      forgot_password_expiry: expireTime,
    });

    await sendEmail({
      sendTo: email,
      subject: 'Forgot password from Binkeyit',
      html: forgotPasswordTemplate({
        name: user.name,
        otp: otp,
      }),
    });

    return res.json({
      message: 'Check your email',
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

// verify forgot password OTP
export const verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: 'Email and OTP fields are required',
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: 'Email not available',
        error: true,
        success: false,
      });
    }

    const currentTime = new Date();

    if (user.forgot_password_expiry < currentTime) {
      return res.status(400).json({
        message: 'OTP has expired',
        error: true,
        success: false,
      });
    }

    if (otp !== user.forgot_password_otp) {
      return res.status(400).json({
        message: 'Invalid OTP',
        error: true,
        success: false,
      });
    }

    const updateUser = await UserModel.findByIdAndUpdate(user?._id, {
      forgot_password_otp: '',
      forgot_password_expiry: '',
    });

    return res.json({
      message: 'OTP verification successful',
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

// reset the password
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: 'All fields must be filled in',
      });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: 'Email is not available',
        error: true,
        success: false,
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: 'Passwords do not match',
        error: true,
        success: false,
      });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(newPassword, salt);

    const update = await UserModel.findOneAndUpdate(user._id, {
      password: hashPassword,
    });

    return res.json({
      message: 'Password updated successfully',
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

// refresh token controller
export const refreshToken = async (req, res) => {
  try {
    const refreshToken =
      req.cookies.refreshToken || req?.headers?.authorization?.split(' ')[1];
    if (!refreshToken) {
      return res.status(401).json({
        message: 'Invalid token',
        error: true,
        success: false,
      });
    }

    const verifyToken = await jwt.verify(
      refreshToken,
      process.env.SECRET_REFRESH_TOKEN,
    );
    if (!verifyToken) {
      return res.status(401).json({
        message: 'token is expired',
        error: true,
        success: false,
      });
    }

    const userId = verifyToken?._id;
    const newAccessToken = await generatedAccessToken(userId);

    const cookieOption = {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
    };

    res.cookie('accessToken', newAccessToken, cookieOption);

    return res.json({
      message: 'New Access token generated',
      error: false,
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

// get login user details
export const userDetails = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await UserModel.findById(userId).select(
      '-password -refresh_token',
    );

    return res.json({
      message: 'user details',
      data: user,
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Someting is wrong',
      error: true,
      success: false,
    });
  }
};
