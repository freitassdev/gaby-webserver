import { Client, Collection } from "eris";
import mongoose from "mongoose";
import fs from "fs";
import c from "colors"
export default class Gaby extends Client {
  constructor(token, options) {
    super(token, options);
    this.aliases = new Collection();
  }

  loadEvents(path = "src/events") {
    var modules = fs.readdirSync(path);
    modules.forEach(module => {
      var events = fs.readdirSync(`${path}/${module}`);
      events.forEach(async evt => {
        const Event = await import(`../events/${module}/${evt}`);
        const event = new Event.default(this);
        this.on(event.name, (...args) => event.run(...args));
      });
    });
  }



  async login() {
    await mongoose.connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(c.bgWhite(c.black("[Gabrielly Status] - Conectada ao banco de dados.")));
    this.connect();
  }
}
