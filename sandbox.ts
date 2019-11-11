const puppeteerConfigOverride = {
    headless: false,
}
const out = {
    headless: true,
    devtools: false,
    ...puppeteerConfigOverride
  }

  console.log(out);