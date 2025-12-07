const { red, green, bold } = require("colorette");
const mustache = require("mustache");
const fs = require("fs");
const { COPYFILE_EXCL } = fs.constants;
const {
  readdir,
  mkdir,
  copyFile,
  readFile,
  writeFile,
} = require("fs").promises;
const path = require("path");

// get args
if (!process.argv[2]) {
  console.log(red(`Node type not specified`));
  return;
}
const nodeTypeInKebabCase = process.argv[2].toLowerCase();
const nodeTemplate = process.argv[3] || "blank";

// convert node-type to all cases
const nodeTypeSegs = nodeTypeInKebabCase.split("-");
const nodeTypeInSnakeCase = nodeTypeSegs.join("_");
const nodeTypeInPascalCase = nodeTypeSegs
  .map((val) => val.charAt(0).toUpperCase() + val.substring(1))
  .join("");
const nodeTypeInCamelCase = nodeTypeSegs
  .map((val, idx) =>
    idx === 0 ? val : val.charAt(0).toUpperCase() + val.substring(1)
  )
  .join("");
const nodeLabel = nodeTypeSegs.join(" ");

const mustacheData = {
  NodeTypeKebabCase: nodeTypeInKebabCase,
  NodeTypeSnakeCase: nodeTypeInSnakeCase,
  NodeTypePascalCase: nodeTypeInPascalCase,
  NodeTypeCamelCase: nodeTypeInCamelCase,
  NodeLabel: nodeLabel,
};

// node files generator
async function generateFiles(fromDir, toDir) {
  // always called for a nonexistent toDir
  await mkdir(toDir);
  console.log(green(`Created directory: ${bold(toDir)}`));

  const fromDirents = await readdir(fromDir, { withFileTypes: true });
  await Promise.all(
    fromDirents.map(async (fromDirent) => {
      const fromFilePath = path.join(fromDir, fromDirent.name);
      let toFilePath = path.join(
        toDir,
        fromDirent.name.replace("node-type", nodeTypeInKebabCase)
      );

      if (fromDirent.isDirectory()) {
        // directory -> recursive call
        await generateFiles(fromFilePath, toFilePath);
      } else {
        // file -> generate
        const ext = path.extname(toFilePath);
        if (ext !== ".mustache") {
          // just copy as-is
          await copyFile(fromFilePath, toFilePath, COPYFILE_EXCL);
          console.log(green(`Copied file: ${bold(toFilePath)}`));
        } else {
          // generate from mustache template
          toFilePath = path.join(
            path.dirname(toFilePath),
            path.basename(toFilePath, ext)
          );
          const tpl = await readFile(fromFilePath, "utf8");
          const renderedStr = mustache.render(tpl, mustacheData, {}, [
            "<%",
            "%>",
          ]);
          await writeFile(toFilePath, renderedStr, "utf8");
          console.log(green(`Generated file: ${bold(toFilePath)}`));
        }
      }
    })
  );
}

async function addNodeToPackageJson() {
  const pkgJsonPath = path.join(__dirname, "..", "package.json");
  const pkgJsonData = JSON.parse(await readFile(pkgJsonPath, "utf8"));
  pkgJsonData["node-red"].nodes[
    nodeTypeInKebabCase
  ] = `./dist/nodes/${nodeTypeInKebabCase}/${nodeTypeInKebabCase}.js`;
  await writeFile(pkgJsonPath, JSON.stringify(pkgJsonData, null, 2), "utf8");
  console.log(green(`Added ${bold(nodeTypeInKebabCase)} to package.json`));
}

async function main() {
  // paths
  const templateDir = path.join(__dirname, "templates", nodeTemplate);
  const newNodeDir = path.join(
    __dirname,
    "..",
    "src",
    "nodes",
    nodeTypeInKebabCase
  );

  // check if paths ok
  if (!fs.existsSync(templateDir)) {
    console.log(red(`Template ${bold(nodeTemplate)} does not exist`));
    return;
  }
  if (fs.existsSync(newNodeDir)) {
    console.log(red(`Node ${bold(nodeTypeInKebabCase)} already exists`));
    return;
  }

  // we can do that now
  console.log(
    green(
      `Generating ${bold(nodeTypeInKebabCase)} node using ${bold(
        nodeTemplate
      )} template`
    )
  );

  try {
    await generateFiles(templateDir, newNodeDir);
    await addNodeToPackageJson();
  } catch (e) {
    console.log(red(`Error: ${bold(e)}`));
    return;
  }
}

main();
