import mongoose from "mongoose";

const User = new mongoose.Schema({
  uId: { type: String },
  donnuts: { type: Number, default: 0 },
  daily: {
    obtained: { type: Number, default: 0 },
    date: { type: Number, default: 0 },
  },
  work: { type: Number, default: 0 },
  about: { type: String, default: "null" },
  reps: { type: Number, default: 0 },
  couple: {
    user: { type: String, default: "null" },
    status: { type: Boolean, default: false },
  },
  backgrounds: {
    obtained: { type: Array, default: [] },
    active: { type: Number, default: 0 },
  },
  cards: {
    obtained: { type: Array, default: [] },
    active: { type: Number, default: 0 },
  },
  vip: {
    obtained: { type: Boolean, default: false },
    date: { type: Number, default: 0 },
  },
})

export default mongoose.model("Users", User);