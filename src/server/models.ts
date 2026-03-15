import mongoose, { Schema, Document } from 'mongoose';

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  created_at: { type: Date, default: Date.now }
});

const jobSchema = new Schema({
  title: { type: String, required: true },
  department: { type: String, required: true },
  posts: { type: Number, required: true },
  qualification: { type: String, required: true },
  ageLimit: { type: String, required: true },
  fee: { type: String, required: true },
  description: { type: String, required: true },
  applyLink: String,
  pdfLink: String,
  createdAt: { type: Date, default: Date.now }
});

const examSchema = new Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  link: String,
  createdAt: { type: Date, default: Date.now }
});

const mockTestSchema = new Schema({
  title: { type: String, required: true },
  timeLimit: { type: Number, required: true },
  marks: { type: Number, required: true },
  questions: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now }
});

const heroImageSchema = new Schema({
  image: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: String,
  buttonText: String,
  buttonLink: String,
  createdAt: { type: Date, default: Date.now }
});

const homeSectionSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: String,
  buttonText: String,
  buttonLink: String,
  createdAt: { type: Date, default: Date.now }
});


const notificationSchema = new Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  type: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
export const Job = mongoose.model('Job', jobSchema);
export const Exam = mongoose.model('Exam', examSchema);
export const MockTest = mongoose.model('MockTest', mockTestSchema);
export const HeroImage = mongoose.model('HeroImage', heroImageSchema);
export const HomeSection = mongoose.model('HomeSection', homeSectionSchema);
export const Notification = mongoose.model('Notification', notificationSchema);
