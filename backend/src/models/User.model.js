const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { autoSlugFromFields } = require('../utils/autoSlug');

const userSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    image: {
        type: String,
        required: [true, 'Image URL is required'],
        match: [/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/, 'Please provide a valid image URL']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false
    },
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'basic', 'premium', 'enterprise'],
        default: 'free'
      },
      startDate: Date,
      endDate: Date,
      isActive: {
        type: Boolean,
        default: true
      }
    },
    lastLogin: {
      type: Date
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);


userSchema.virtual('totalLocations', {
  ref: 'Location',
  localField: '_id',
  foreignField: 'userId',
  count: true
});


userSchema.index({ email: 1 });
userSchema.index({ slug: 1 });
userSchema.index({ createdAt: -1 });


userSchema.pre('save', async function (next) {
  // Auto-generate slug from name or email if not exists
  if (!this.slug && this.isNew) {
    const baseString = this.name || this.email.split('@')[0];
    this.slug = await autoSlugFromFields({
      model: mongoose.model('User'),
      sources: ['name', 'email'],
      doc: this,
      fallback: 'user',
      useRandomSuffix: false
    });
  }

  // Hash password if modified
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }

  next();
});

userSchema.methods.regenerateSlug = async function () {
  this.slug = await autoSlugFromFields({
    model: mongoose.model('User'),
    sources: ['name', 'email'],
    doc: this,
    fallback: 'user',
    useRandomSuffix: false
  });
  await this.save();
  return this.slug;
};

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    slug: this.slug,
    name: this.name,
    email: this.email,
    businessName: this.businessName,
    role: this.role,
    subscription: this.subscription,
    createdAt: this.createdAt
  };
};

userSchema.statics.findBySlug = async function (slug) {
  return await this.findOne({ slug });
};

const User = mongoose.model('User', userSchema);

module.exports = User;