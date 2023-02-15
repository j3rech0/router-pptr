import React, { useState } from "react";
const puppeteer = require("puppeteer");

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const RebootWifi = () => {
  const [formData] = useState({
    username: process.env.USER,
    password: process.env.PASS,
    server: process.env.SERVER,
    url: process.env.URL,
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);

    if (!formData.username || !formData.password) {
      setError("Check user credentials.");
      setLoading(false);
      setStatus(null);
      return;
    }

    await delay(1000);

    try {
      const browser = await puppeteer.connect({
        browserWSEndpoint: formData.server,
      });
      const context = await browser.createIncognitoBrowserContext();
      const page = await context.newPage();
      const mainframe = await page.mainFrame();

      page.on("dialog", async (dialog) => {
        try {
          await dialog.accept();
        } catch (e) {
          console.log(e);
        }
      });

      const routerPage = async () => {
        await page.goto(formData.url + "/login_pldt.asp", {
          waitUntil: "networkidle0",
        });

        await page.type("#User", formData.username);
        await page.type("#Passwd", formData.password);

        page.evaluate(() => {
          document.querySelector("input[type=submit]").click();
        });

        setStatus("Checking user credentials...");
        await Promise.all([page.waitForNavigation()]);

        // If success
        if (mainframe._navigationURL == formData.url + "/tomenu.html") {
          setSuccess("Successfully logged in.");
          setError(null);
          setLoading(false);
          setStatus(null);

          await page.goto(formData.url + "/menu_pldt.asp", {
            waitUntil: "networkidle0",
          });

          page.evaluate(() => {
            document.querySelector("#headerTab li:nth-child(4)").click();
            document.querySelector("#nav li:nth-child(2)").click();
          });

          await delay(1000);

          const childframe = page
            .frames()
            .find((mainframe) => mainframe.name().includes("frameContent"));

          const rebootBtn = "#reboot_apply";
          const logoutBtn = "#headerLogoutSpan";

          await Promise.all([
            childframe.waitForNavigation(),
            childframe.$eval(
              rebootBtn,
              (element) => {
                console.log(element.value);
                // rebootConfirm();
              },
              setSuccess("Rebooting router.")
              
            ),
          ]);
         
        }

        // If error
        if (mainframe._navigationURL == formData.url + "/login.html") {
          setError("Session timeout");
          setSuccess(null);
          setStatus(null);
          setLoading(false);

          const childframe = page
            .frames()
            .find((mainframe) => mainframe.name().includes("loginPage"));
          const childHTML = await childframe.content();

          await delay(2000);

          let words;
          if ((words = childHTML.includes("somewhere")))
            setError(
              "The user has logged in somewhere else. Please try again later!"
            );
          if ((words = childHTML.includes("Error!"))) {
            setError("Username or Password Error!");
          }
          if ((words = childHTML.includes("times"))) {
            setError(
              "Username or password is wrong 3 times, please retry 1 minute later!"
            );
          }

          page.close();
          browser.close();
          return;
        }
      };

      await routerPage();
    } catch (error) {
      console.log("error ", error);

      setError("Server error");
      setSuccess(null);
      setStatus(null);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={loading}>
        {loading ? "Rebooting..." : "Reboot router?"}
      </button>
      <p>
        {status}
        {error && <span style={{ color: "red" }}>{error}</span>}
        {success && <span style={{ color: "green" }}>{success}</span>}
      </p>
    </form>
  );
};

export default RebootWifi;
