import mongoose from "mongoose";

const Schema = mongoose.Schema;

let commandSchema = new Schema({
  _id: { type: String },
  usages: { type: Number, default: 0 },
});

export default mongoose.model("Commands", commandSchema);