import { optionList } from "../../../dist/cli/cli-options"

export const consts = {
    githubOrgUrl: "https://github.com/open-wa",
    domain: "docs.openwa.dev",
}

const cliOptionsToMDTable = () => {
    let table = `
  | Option | Type | Description |
  |-------|------|-------|
`
    optionList.map((option) => {
        table += `| --${option.name} | ${option.type?.prototype.constructor.name.toLowerCase() || ""} | ${option.description}${Object.keys(option).includes("default") ? ` (default: ${option.default})` : ""} |\n `
    })
    return table;
}

export const customFields = {
    artifactHubUrl: "",
    copyright: `Copyright © ${new Date().getFullYear()} open-wa`,
    crunchbaseUrl: "",
    demoUrl: `https://demo.${consts.domain}`,
    description:
        "Open-wa is an open source project designed to make building WA-based chatbots lightning fast and easy. It exposes a high performance REST API and is highly-customizable.",
    dockerUrl: "https://hub.docker.com/r/openwa/wa-automate",
    domain: consts.domain,
    githubOrgUrl: consts.githubOrgUrl,
    discordInviteUrl: "https://discord.gg/dpan7EYE3t",
    githubUrl: `${consts.githubOrgUrl}/wa-automate-nodejs`,
    linkedInUrl: "",
    oneLiner: "QuestDB: the database for time series",
    slackUrl: `https://slack.${consts.domain}`,
    stackoverflowUrl: "https://stackoverflow.com/questions/tagged/open-wa",
    twitterUrl: "https://twitter.com/openwadev",
    videosUrl: "",
    cliOptionsTable: cliOptionsToMDTable(),
    labels: {
        // "license:insiders": `:::note May require Insiders license\nUse this link to get the [correct license](../../backend/users.m).\n:::`
        "license:insiders": `<span theme="badge contrast license">Insiders</span>`
        // "license:insiders": `::youtube[Video of a cat in a box]{#01ab2cd3efg}`
    }
}