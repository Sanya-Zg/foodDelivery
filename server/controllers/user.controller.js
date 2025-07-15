import sendEmail from '../config/sendEmail.js';
import UserModel from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import verifyEmailTemplate from '../utils/verifyEmailTemplate.js';

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
      success: true
    })
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};
