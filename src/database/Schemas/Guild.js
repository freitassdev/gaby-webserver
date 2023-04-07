import mongoose from "mongoose";

const Schema = mongoose.Schema;

let guildSchema = new Schema({
  gId: { type: String },
  language: { type: String, default: "pt-BR" },
  //logs
  welcome: {
    status: { type: Boolean, default: false },
    welcomeChannel: { type: String, default: "null" },
    welcomeMsg: {
      type: String,
      default:
        "Bem-vindo(a) {user.username} a {server.name}, atualmente temos {server.membros} membros, divirta-se conosco!",
    },
  },
  goodbye: {
    status: { type: Boolean, default: false },
    leaveChannel: { type: String, default: "null" },
    leaveMsg: {
      type: String,
      default: "Adeus {user.username}, vamos sentir sua falta!",
    },
  },
  logs: {
    channel: { type: String, default: "null" },
    status: { type: Boolean, default: false },
  },
  autorole: {
    status: { type: Boolean, default: false },
    roles: { type: Array },
  },
  antifake: {
    status: { type: Boolean, default: false },
    days: { type: Number, default: 0 },
    logs: { type: String, default: "null" },
  },
});

export default mongoose.model("Guilds", guildSchema);