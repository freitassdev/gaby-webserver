import fetch from 'node-fetch';
import express from 'express';
import passport from 'passport';
import bodyParser from 'body-parser';
import GuildSettings from '../database/Schemas/Guild.js';
import Tokens from '../database/Schemas/Tokens.js';
import User from '../database/Schemas/User.js';
const app = express();
import axios from "axios";
import cors from "cors";
import c from "colors";
import genkey from "generate-key";
export default class DashboardApi {
  constructor() {
    this.name = "gabydashboard"
  }
  async run(client) {
    let cooldown = 600000;
    const callback = "https://gabrielly.website";
    let canaryhost = "http://localhost:5173"
    var usercb;

const corsOptions = {
  origin: ['https://gabrielly.website', 'http://localhost:5173']
};

app.use(cors(corsOptions));
    app.use(express.json())
    app.use(passport.initialize());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
      extended: true
    }));

    async function getAccessToken(token, refresh, date) {
      if (cooldown - (Date.now() - date) < 0) {
        const refreshed = await refreshToken(refresh);
        return refreshed.access_token;
      } else {
        return token;
      }
    }

    async function refreshToken(refresh) {
      let refreshed;
      let options = {
        url: 'https://discord.com/api/oauth2/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'client_id': process.env.BOT_ID,
          'client_secret': process.env.CLIENT_SECRET,
          'grant_type': 'refresh_token',
          'refresh_token': refresh
        })
      }

      let discord_refresh = await fetch('https://discord.com/api/oauth2/token', options).then((response) => {
        return response.json();
      }).then(async (response) => {
        await Tokens.findOneAndUpdate(
          { refresh: refresh, },
          {
            $set: {
              "date": Date.now(),
              "access": response.access_token,
              "refresh": response.refresh_token,
            }
          }
        );
        refreshed = response;
      });
      return refreshed;
    }

    app.get("/callback", async (req, res) => {
      const code = req.query.code;
      let options = {
        url: 'https://discord.com/api/oauth2/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'client_id': process.env.BOT_ID,
          'client_secret': process.env.CLIENT_SECRET,
          'grant_type': 'authorization_code',
          'code': code,
          'redirect_uri': "https://gaby-server.onrender.com/callback"
        })
      }
      let discord_res = await fetch('https://discord.com/api/oauth2/token', options).then((response) => {
        return response.json();
      }).then(async (response) => {
        if (response.error) {
          return res.status(500).send({ error: "INTERNAL API ERROR" });
        }
        try {
          const generatedkey = genkey.generateKey(7);
          const resp = await axios.get(`https://discordapp.com/api/users/@me`, {
            headers: { Authorization: `Bearer ${response.access_token}` }
          })
          const find = await Tokens.findOne({ id: resp.data.id });
          if (find) {
            await Tokens.findOneAndUpdate(
              { id: resp.data.id, },
              {
                $set: {
                  "date": Date.now(),
                  "access": response.access_token,
                  "refresh": response.refresh_token,
                },
                $push: {
                  "key": generatedkey,
                }
              }
            );

          } else {
            await Tokens.create({
              id: resp.data.id,
              access: response.access_token,
              refresh: response.refresh_token,
              key: [generatedkey],
              date: Date.now(),
            })
          } res.redirect(`http://gabrielly.website/callback?id=${resp.data.id}&key=${generatedkey}`);
        } catch (err) {
          console.log(err)
        }
      });
    })


    ///////////////////////////
    app.get("/api/get", async (req, res) => {
          let operation = req.query.operation;
          let uQueryId = req.query.id;
          let uKeyAccess = req.query.key;
          let guildId = req.query.guild;
          const infoTypes = req.query.infoTypes.split(',');
          //ROTAS/FUNÇÕES
          async function getUserInfo(key, id) {
            console.log(key, id)
            if (key && id) {
              const find = await Tokens.findOne({ key: key });
              if (find && find.id === id) {
                let finallyResponse;
                try {
                  const accessToken = await getAccessToken(find.access, find.refresh, find.date);
                  let response = await fetch(`https://discordapp.com/api/users/@me`, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${accessToken}`,
                    },

                  });
                  finallyResponse = await response.json();
                  return finallyResponse;
                } catch (err) {
                  console.log(err)
                  return "Error on get user data";
                }
              }
            } else {
              return "INTERNAL API ERROR";
            }
          }
          ///////////////////////////////////
          async function getUserGuilds(key, id) {
            if (key && id) {
              const find = await Tokens.findOne({ key: key });
              if (find && find.id === id) {
                try {
                  const discordcallback = await axios.get(`https://discordapp.com/api/users/@me/guilds`, { headers: { Authorization: `Bearer ${find.access}` } });
                  const guilds = [];
                  Promise.all(discordcallback.data.map((guild) => {
                    if (client.guilds.get(guild.id)) {
                      guild.has = true;
                    }
                    guilds.push(guild);
                  }));
                  return guilds;
                } catch (err) {
                  console.log(err)
                  return "INTERNAL API ERROR";
                }
              }
            }
          }
          /////////////////////
          async function getGuildRoles(key, id, guild) {
            let finallyResponse;
            if (key && id && guild) {
              const find = await Tokens.findOne({ key: key });
              if (find && find.id === id) {
                try {
                  const response = await fetch(`https://discord.com/api/v10/guilds/${guild}/roles`, {
                    method: 'GET',
                    headers: {
                      'Authorization': `Bot ${process.env.TOKEN}`
                    },
                  });
                  finallyResponse = await response.json();
                  return finallyResponse;
                } catch (err) {
                  return "Internal API Error."
                }
              }
            }
          }
          ///////////////////////////
          const infoFunctions = {
            userInfo: {
              func: getUserInfo,
              args: [],
            },
            guilds: {
              func: getUserGuilds,
              args: [],
            },
            guildRoles: {
              func: getGuildRoles,
              args: ['guild'],
            },
            // outras funções aki
          };

          const info = {};
          const promises = [];
          infoTypes.forEach((infoType) => {
            const funcData = infoFunctions[infoType];
            if (funcData) {
              const func = funcData.func;
              const args = funcData.args.map(argName => req.query[argName] || null);
              promises.push(func(uKeyAccess, uQueryId, ...args).then((result) => { info[infoType] = result; }));
            }
          });
          await Promise.all(promises);
          console.log(info)
          res.json(info);
    })

    ////////////////////////////DATABASE//////////////////////////////

    app.get("/api/db/get", async (req, res) => {
      if (req.headers["origin"] === callback || req.headers["origin"] === canaryhost) {
        if (req.socket.remoteAddress.split(':').slice(-1).toString() === "172.31.128.1") {
          let operation = req.query.operation;
          let uQueryId = req.query.id;
          let uKeyAccess = req.query.key;
          let guildId = req.query.guild;
          const infoTypes = req.query.infoTypes.split(',');
          //ROTAS/FUNÇÕES
          async function getUserInfo(key, id) {
            if (key && id) {
              const find = await Tokens.findOne({ key: key });
              if (find && find.id === id) {
                let finallyResponse;
                try {
                  const accessToken = await getAccessToken(find.access, find.refresh, find.date);
                  let response = await fetch(`https://discordapp.com/api/users/@me`, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${accessToken}`,
                    },

                  });
                  finallyResponse = await response.json();
                  return finallyResponse;
                } catch (err) {
                  console.log(err)
                  return "Error on get user data";
                }
              }
            } else {
              return "INTERNAL API ERROR";
            }
          }
          ///////////////////////////////////
          async function getUserGuilds(key, id) {
            if (key && id) {
              const find = await Tokens.findOne({ key: key });
              if (find && find.id === id) {
                try {
                  const discordcallback = await axios.get(`https://discordapp.com/api/users/@me/guilds`, { headers: { Authorization: `Bearer ${find.access}` } });
                  const guilds = [];
                  Promise.all(discordcallback.data.map((guild) => {
                    if (client.guilds.get(guild.id)) {
                      guild.has = true;
                    }
                    guilds.push(guild);
                  }));
                  return guilds;
                } catch (err) {
                  console.log(err)
                  return "INTERNAL API ERROR";
                }
              }
            }
          }
          /////////////////////
          async function getGuildRoles(key, id, guild) {
            let finallyResponse;
            if (key && id && guild) {
              const find = await Tokens.findOne({ key: key });
              if (find && find.id === id) {
                try {
                  const response = await fetch(`https://discord.com/api/v10/guilds/${guild}/roles`, {
                    method: 'GET',
                    headers: {
                      'Authorization': `Bot ${process.env.TOKEN}`
                    },
                  });
                  finallyResponse = await response.json();
                  return finallyResponse;
                } catch (err) {
                  return "Internal API Error."
                }
              }
            }
          }
          ///////////////////////////
          const infoFunctions = {
            userInfo: {
              func: getUserInfo,
              args: [],
            },
            guilds: {
              func: getUserGuilds,
              args: [],
            },
            guildRoles: {
              func: getGuildRoles,
              args: ['guild'],
            },
            // outras funções aki
          };

          const info = {};
          const promises = [];
          infoTypes.forEach((infoType) => {
            const funcData = infoFunctions[infoType];
            if (funcData) {
              const func = funcData.func;
              const args = funcData.args.map(argName => req.query[argName] || null);
              promises.push(func(uKeyAccess, uQueryId, ...args).then((result) => { info[infoType] = result; }));
            }
          });
          await Promise.all(promises);
          res.json(info);
        }
      }
    })

    app.get("/getrolesdb", async (req, res) => {
      if (req.headers["origin"] === callback || req.headers["origin"] === canaryhost) {
        if (req.socket.remoteAddress.split(':').slice(-1).toString() === "172.31.128.1") {

          const guild = req.query.guild;
          const key = req.query.key;
          const id = req.query.id;
          if (key && id && guild) {
            const find = await Tokens.findOne({ key: key });
            if (find && find.id === id) {
              try {
                const autoroles = await GuildSettings.findOne({ gId: guild, });
                if (!autoroles) {
                  await GuildSettings.create({
                    gId: guild,
                  })
                  res.send(null);
                }

                res.send(autoroles.autorole);
              } catch (err) {
                res.send({ error: "INTERNAL API ERROR" });
              }
            }
          }
        }
      } else {
        return res.status(500).send({ error: "INTERNAL API aOR" });
      }
    })

    app.get("/getdb", async (req, res) => {
      if (req.headers["origin"] === callback || req.headers["origin"] === canaryhost) {
        if (req.socket.remoteAddress.split(':').slice(-1).toString() === "172.31.128.1") {

          const guild = req.query.guild;
          const key = req.query.key;
          const id = req.query.id;
          if (key && id && guild) {
            const find = await Tokens.findOne({ key: key });
            if (find && find.id === id) {
              try {
                const database = await GuildSettings.findOne({ gId: guild, });
                if (!database) {
                  await GuildSettings.create({
                    gId: guild,
                  })
                  const newDatabase = await GuildSettings.findOne({ gId: guild, });
                  res.send(newDatabase);
                }

                res.send(database);
              } catch (err) {
                res.send({ error: "INTERNAL API ERROR" });
              }
            }
          }
        }
      } else {
        return res.status(500).send({ error: "INTERNAL API aOR" });
      }
    })
    app.post("/postdb", async (req, res) => {
      if (req.headers["origin"] === callback || req.headers["origin"] === canaryhost) {
        if (req.socket.remoteAddress.split(':').slice(-1).toString() === "172.31.128.1") {

          const guild = req.query.guild;
          const key = req.query.key;
          const id = req.query.id;
          if (key && id && guild) {
            const find = await Tokens.findOne({ key: key });
            if (find && find.id === id) {
              try {
                const savedata = await GuildSettings.findOneAndUpdate(
                  { gId: guild },
                  {
                    $set: {
                      "language": req.body.language,
                    }
                  });
                res.send("success");
              } catch (err) {
                res.send({ error: "INTERNAL API ERROR" });
              }
            }
          }
        }
      } else {
        return res.status(500).send({ error: "INTERNAL API ERROR" });
      }
    })
    app.post("/postrolesdb", async (req, res) => {
      if (req.headers["origin"] === callback || req.headers["origin"] === canaryhost) {
        if (req.socket.remoteAddress.split(':').slice(-1).toString() === "172.31.128.1") {

          const guild = req.query.guild;
          const key = req.query.key;
          const id = req.query.id;
          if (key && id && guild) {
            const find = await Tokens.findOne({ key: key });
            if (find && find.id === id) {
              try {
                const autoroles = await GuildSettings.findOneAndUpdate(
                  { gId: guild },
                  {
                    $set: {
                      "autorole.roles": req.body.roles,
                      "autorole.status": req.body.status,
                    }
                  });
                res.send("success");
              } catch (err) {
                res.send({ error: "INTERNAL API ERROR" });
              }
            }
          }
        }
      } else {
        return res.status(500).send({ error: "INTERNAL API ERROR" });
      }
    })

    app.get("/getuserdb", async (req, res) => {
      if (req.headers["origin"] === callback || req.headers["origin"] === canaryhost) {
        if (req.socket.remoteAddress.split(':').slice(-1).toString() === "172.31.128.1") {

          const id = req.query.id;
          const key = req.query.key;
          const uId = req.query.uId;
          if (key && id) {
            const find = await Tokens.findOne({ key: key });
            if (find && find.id === id) {
              try {
                const database = await User.findOne({ uId: uId, });
                if (!database) {
                  await User.create({
                    uId: uId,
                  })
                  const newDatabase = await User.findOne({ uId: uId, });
                  res.send(newDatabase);
                }

                res.send(database);
              } catch (err) {
                res.send({ error: "INTERNAL API ERROR" });
              }
            }
          }
        }
      } else {
        return res.send({ error: "INTERNAL API ERROR" });
      }
    })

    app.get("/postdailydb", async (req, res) => {
      if (req.headers["origin"] === callback || req.headers["origin"] === canaryhost) {
        if (req.socket.remoteAddress.split(':').slice(-1).toString() === "172.31.128.1") {

          const id = req.query.id;
          const key = req.query.key;
          const value = req.query.value;
          if (key && id) {
            const find = await Tokens.findOne({ key: key });
            if (find && find.id === id) {
              try {
                const database = await User.findOneAndUpdate({ uId: id },
                  {
                    $set: {
                      "daily.date": Date.now(),
                      "daily.obtained": value,
                    }
                  });


                res.send("success");
              } catch (err) {
                console.log(err)
                res.send({ error: "INTERNAL API ERROR" });
              }
            }
          }
        }
      } else {
        return res.send({ error: "INTERNAL API ERROR" });
      }
    })

    app.post("/recaptcha", async (req, res) => {
      if (req.headers["origin"] === callback || req.headers["origin"] === canaryhost) {
        if (req.socket.remoteAddress.split(':').slice(-1).toString() === "172.31.128.1") {
          const { token } = req.body;
          const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.SECRET_KEY}&response=${token}`
          );
          return res.send(response.data);
        }
      }
    })
    app.get("/", (req, res) => {
      res.send("rray")
    })


    app.listen("8080", null, null, () => console.log(c.bgRed(c.white("[Api]: Carregado e Iniciado")))
    );

  }
}