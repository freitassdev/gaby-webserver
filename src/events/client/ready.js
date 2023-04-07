import Event from "../../structures/Event.js";
import Dashboard from '../../dashboard/index.js';
import c from "colors";
export default class ReadyEvent extends Event {
  constructor(client) {
    super(client);
    this.client = client;
    this.name = "ready";
  }
  async run() {
    
  const dash = new Dashboard(this.client);
      dash.run(this.client);
      console.log(c.bgWhite(c.black("[Gabrielly Status] - Dashboard iniciado!")))
    
  }
}