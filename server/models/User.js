const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer', required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, result) {
        delete result.passwordHash;
        delete result.__v;
        return result;
      },
    },
  },
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
