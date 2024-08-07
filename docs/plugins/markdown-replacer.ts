import { replaceInFileSync } from 'replace-in-file'
import { visit } from 'unist-util-visit';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { customFields } from "../src/config/consts"


const RE_VAR = /{@([\w-_]+)@}/g
const RE_VAR_NEW = /\|@\|([\w-_]+)\|@\|/g
const RE_LABEL = /{@([\w-:]+)@}/
const BLOCK_REGEX = /#{3}.*[.,\s]*.*[.,\s]*{@([\w-:]+)@}/g

export function markdownReplacerPlugin(context, options) {
      // ...
      return {
        name: 'md-placeholder-replacer',
        async loadContent() {
          // ...
          /**
           * Find and replace placeholders in markdown files.
           */
          replaceInFileSync({
            files: './docs/reference/**/*.md',
            from: BLOCK_REGEX,
            to: (match) => {
              const labelMatch = match.match(RE_LABEL)
              if (!labelMatch) return match
              const initLabelText = labelMatch[0]
              const [type, subtype] = labelMatch[1].split(":")
              const heading = match.match(/#{3}.*/) && match.match(/#{3}.*/)[0] || ""
              match = match.replace(heading, `${heading} <div class="label ${type} ${subtype}">${subtype}</div>`)
              const variant = subtype == "restricted" ? '1%20Restricted%20License' : 'Insiders%20Program'
              match = match.replace(initLabelText, `:::${type} May require ${subtype} license\nUse this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=${variant}).\n:::`)
              // match = match.replace(initLabelText, `${type} May require ${subtype} license\nUse this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=${variant}).\n`)
              return match;
            }
          })
        },
        async contentLoaded({ content, actions }) {
          // console.log("🚀 ~ file: docusaurus.config.js ~ line 458 ~ contentLoaded ~ content", content)
          // process.exit()
          // actions.addRoute(conf)
          // ...
        },
      };
  }
  
const parseMD = (md) => unified()
.use(remarkParse)
.use(remarkGfm)
.parse(md)

export const iterate = (obj) => {
Object.keys(obj).forEach(key => {

  if (obj[key]?.includes && obj[key] == ("]")) console.log(`key: ${key}, value: ${obj[key]}`)

  if (typeof obj[key] === 'object' && obj[key] !== null) {
    iterate(obj[key])
  }
})
}

export function variable() {
const getVariable = (full, partial) =>
  partial ? customFields[partial] : full

const getLabel = (full, partial) => partial ? customFields.labels[partial] : full


 function textVisitor(node, vfile) {
  if (!["text", "code"].includes(node.type)) return
  const matches = node.value.match(RE_VAR_NEW)
  if (matches) {
    console.log("🚀 ~ textVisitor ~ matches:", matches)
    //check if it's meant to be a table
    if (matches.find(match => match.toLowerCase().includes("table"))) {
      const field = matches[0].replace(RE_VAR_NEW, (_, x) => x)
      const resss = parseMD(customFields[field]).children[0]
      Object.assign(node, resss)
    }
    else node.value = node.value.replace(RE_VAR_NEW, getVariable)
  } else if (node.value === "]") {
    // console.log("EMPTY NODE", node)
    Object.assign(node, parseMD(``).children[0])
  } else if (node.value.match(RE_LABEL)) {
    // console.log("🚀 ~ file: docusaurus.config.js ~ line 125 ~ textVisitor ~ node, vfile", node, vfile)
    console.log("THIS IS A LABEL", node.value);
    // nodeReplace(node, node.value.replace(RE_LABEL, getLabel))
    // console.log("🚀 ~ file: docusaurus.config.js ~ line 143 ~ textVisitor ~ match", match)
    // node.value = node.value.replace(RE_LABEL, getLabel)
    // console.log("🚀 ~ file: docusaurus.config.js ~ line 157 ~ textVisitor ~ node.value", node.value)
    // console.log(JSON.stringify(parseAdmonMd(node.value)))
    // // const children = parseAdmonMd(node.value).children;
    // const firstChildNode = parseAdmonMd(node.value).children[0];
    // // firstChildNode.children[0].value = children.flatMap(x=>x.children?.flatMap(x=>x.value) || x.value).join("\n")
    // //append rest of the nodes' values to the firstChildNode value

    // Object.assign(node, firstChildNode)
    // console.log("REPLACED", JSON.stringify(node));
  }
  //maybe it's a config link
  // else if(node.value.match(confRegex)){
  // else if(node.value.includes("ConfigObject.sessionId") || node.value.includes("[[")){
  //   console.log('asdasdasd', node, node.value, node.parent)
  //   nodeReplace(node, node.value.replace(confRegex, (full,partial) => `[\`${partial}\`](/docs/api/interfaces/api.ConfigObject#${partial})` ))
  // }
}

function linkVisitor(node) {
  node.url = node.url.replace(RE_VAR, getVariable)
  if (!node.url) console.log("🚀 ~ file: docusaurus.config.js ~ line 47 ~ linkVisitor ~ node", node)
  if (node.title) {
    node.title = node.title.replace(RE_VAR, getVariable)
    if (node.title?.includes("ConfigObject.")) {
      console.log('xxxxx', node)
    }
  }
}
function linkReferenceVisitor(node) {
  const linkRefReplace = (node, rawMd) => Object.assign(node, parseMD(rawMd).children[0].children[0])
  if (node.label.startsWith("ConfigObject.")) {
    // linkRefReplace(node,`[\`${node.label}\`](/docs/api/interfaces/api.ConfigObject#${node.label.replace("ConfigObject.", "")})`)
  } else if (node.label.startsWith("create")) {
    // linkRefReplace(node,`[\`${node.label.replace("api.","")}\`](/docs/api/modules/controllers#create)`)
  } else if (node.label.startsWith("Client.")) {
    // linkRefReplace(node,`[\`${node.label.replace("api.","")}\`](/docs/api/classes/api.client/${node.label})`)
  }
  Object.assign(node, parseMD(node.value))
}

 function paraVisitor(node) {
  // if(node?.children?.find(child=>child?.value?.includes("ConfigObject"))) console.log(node)
  iterate(node)
  // if(node?.children?.find(child=>Object.entries(child).find(([_,v])=>v?.includes && v?.includes("[[")))) console.log(node)
}

 function transformer(ast) {
  visit(ast, "text", textVisitor)
  visit(ast, "code", textVisitor)
  // visit(ast, "link", linkVisitor)
  // visit(ast, "linkReference", linkReferenceVisitor)
  // visit(ast, paraVisitor)
}

return transformer
}
