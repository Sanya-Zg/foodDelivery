import sendEmail from '../config/sendEmail.js';
import UserModel from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import verifyEmailTemplate from '../utils/verifyEmailTemplate.js';
import generatedAccessToken from '../utils/generatedAccessToken.js';
import generateRefreshToken from '../utils/generateRefreshToken.js';
import uploadImageCloudinary from '../utils/uploadImageCloudinary.js';

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
    const updateUser = await UserModel.findByIdAndUpdate(userId, {
      ...(name && { name: name }),
      ...(email && { email: email }),
      ...(mobile && { mobile: mobile }),
      ...(password && { password: hashPassword }),
    }, {new: true});

    return res.json({
      message: 'Updated user successfully',
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
