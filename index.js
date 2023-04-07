import dotenv from "dotenv";
import Client from "./src/structures/Client.js";
dotenv.config();
import fs from "fs"
import { GiveawaysManager } from "eris-giveaways";
const client = new Client(process.env.TOKEN, {
 intents: 32767,
 restMode: true
});


client.loadEvents();
client.login();