import mongoose from "mongoose";

let clientSchema = new mongoose.Schema({
  _id: { type: String },
  blacklist: { type: Array, default: [] },
  ranks: {
    coins: { type: Array, default: [] },
  },
  ids: { type: Array, default: [1] },
});

export default mongoose.model("Client", clientSchema);