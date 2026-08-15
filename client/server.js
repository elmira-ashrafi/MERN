//custom server: it proxies the api and the uploaded files so the browser only ever talks to one origin

import next from "next";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

// `npm start` passes --prod so production does not depend on NODE_ENV being exported by the shell
const dev =
  process.env.NODE_ENV !== "production" && !process.argv.includes("--prod");
const port = parseInt(process.env.PORT || "3000", 10);
const apiTarget = process.env.API_TARGET || "http://127.0.0.1:8000";

const app = next({ dev });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = express();

    /*
     * Both proxies are unconditional. Gating /api behind `dev` used to leave production with
     * no route to the backend at all, since there are no rewrites in next.config.js.
     */
    server.use(
      "/api",
      createProxyMiddleware({
        target: `${apiTarget}/api`,
        changeOrigin: true,
        xfwd: true,
      }),
    );

    server.use(
      "/uploads",
      createProxyMiddleware({
        target: `${apiTarget}/uploads`,
        changeOrigin: true,
        xfwd: true,
      }),
    );

    server.use((req, res) => {
      return handle(req, res);
    });

    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`server ready on http://127.0.0.1:${port}`);
    });
  })
  .catch((err) => console.log(err));
