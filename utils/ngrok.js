import nodemon from "nodemon";
import ngrok from "ngrok";
import dotenv from "dotenv";
dotenv.config();
const port = 3100;

nodemon({
  script: "server.js",
  ext: "js",
});

let url = null;

nodemon
  .on("start", async () => {
    console.log("server.js just started");
    try {
      if (!url) {
        await ngrok.authtoken(process.env.NGROK_TOKEN);
        url = await ngrok.connect({ port: port });
        console.log(`Server now available at ${url}`);
      }
    } catch (error) {
      console.log(error);
    }
  })
  .on("quit", async () => {
    try {
      console.log("killing app.js");
      await ngrok.kill();
    } catch (error) {
      console.log(error);
    }
  });
