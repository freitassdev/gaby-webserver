import mongoose from "mongoose";

let tokenSchema = new mongoose.Schema({
  id: { type: String, default: null },
  access: { type: String, default: null },
  refresh: { type: String, default: null },
  key: { type: Array, default: [] },
  date: { type: Number, default: null }
});

export default mongoose.model("Tokens", tokenSchema);