const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { success, fail } = require('../utils/response');
const userModel = require('../models/userModel');
const candidateModel = require('../models/candidateModel');
const employerModel = require('../models/employerModel');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

async function register(req, res, next) {
  try {
    const {
      Username,
      Email,
      Password,
      FName,
      LName,
      Address,
      Phonenume,
      Profile_Picture,
      Bdate,
      role,
      PackageName
    } = req.body;

    if (!Username || !Email || !Password || !FName || !LName) {
      return fail(res, 'Thiếu thông tin bắt buộc', 400);
    }

    const existing = await userModel.findByEmail(Email);
    if (existing) {
      return fail(res, 'Email đã được sử dụng', 400);
    }

    const hashed = await bcrypt.hash(Password, 10);
    const { id } = await userModel.createUser({
      Username,
      Email,
      Password: hashed,
      FName,
      LName,
      Address: Address || '',
      Phonenume: Phonenume || '',
      Profile_Picture: Profile_Picture || '',
      Bdate
    });

    if (role === 'CANDIDATE') {
      await candidateModel.createCandidate(id);
    } else if (role === 'EMPLOYER') {
      await employerModel.createEmployer(id, PackageName || 'Basic');
    }

    return success(res, { id }, 'Đăng ký thành công', 201);
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { Email, Password } = req.body;
    if (!Email || !Password) {
      return fail(res, 'Thiếu Email hoặc Password', 400);
    }

    const user = await userModel.findByEmail(Email);
    if (!user) {
      return fail(res, 'Thông tin đăng nhập không hợp lệ', 401);
    }

    const matched = await bcrypt.compare(Password, user.Password);
    if (!matched) {
      return fail(res, 'Thông tin đăng nhập không hợp lệ', 401);
    }

    // Xác định role dựa trên bảng candidate / employer
    let role = 'USER';
    if (await candidateModel.exists(user.ID)) role = 'CANDIDATE';
    if (await employerModel.exists(user.ID)) role = 'EMPLOYER';

    const token = jwt.sign(
      {
        id: user.ID,
        role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return success(res, { token, role, id: user.ID }, 'Đăng nhập thành công');
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res) {
  // Với JWT: frontend chỉ cần xoá token. Backend trả 200 là đủ.
  return success(res, null, 'Đăng xuất thành công');
}

module.exports = {
  register,
  login,
  logout
};


