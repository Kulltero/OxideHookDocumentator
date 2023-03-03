const { rm, writeFile, mkdir } = require('node:fs/promises');
const path = require('path');

const prepareHooksForMarkdown = require('./loadHookJson.js');
const jsonToMarkdown = require('./template.js');

// extend built in documentation plugin
const docsPluginExports = require('@docusaurus/plugin-content-docs');

const docsPlugin = docsPluginExports.default;

async function loadOxideHookDocumentation(context) {
  // attempt to load patcher json and add markdown sections, will return null if no content found
  var json = await prepareHooksForMarkdown();

  if (json != null) {
    // wipe docs/hooks folder to regenerate hook markdown
    let docDir = path.resolve(context.siteDir, 'docs', 'hooks');
    await rm(docDir, { force: true, recursive: true }).catch((err) => {
      console.log('docs/hooks failed to get deleted');
    });

    // loop over each hook and create the markdown based on the template
    for (let [hook, hookData] of Object.entries(json)) {
      var markdown = await jsonToMarkdown(hookData, hook);
      // skip invalid markdown files
      if (markdown == null) continue;

      // ensure folder exists for category
      let category =
        hookData.category != 'undefined' ? hookData.category : 'miscellaneous';
      await mkdir(path.resolve(docDir, category), { recursive: true });
      // save markdown to a file in the docs/hooks/{category} folder, note the mdx extention to allow markdown & mdx formatting
      let routePath = path.resolve(
        docDir,
        category,
        (hookData.slugName != undefined ? hookData.slugName : hook) + '.mdx'
      );
      await writeFile(routePath, markdown).catch(console.error);
    }
  } else {
    console.error(
      'JSON provided was not an object, verify the schema in your patcherOutput.json file'
    );
  }
}

async function oxide_docsPlugin(...args) {
  const docsPluginInstance = await docsPlugin(...args);

  let context = args.at(0);
  return {
    ...docsPluginInstance,
    loadContent: async function (...loadContentArgs) {
      // creates oxide hook documentation & adds it to the source folder before letting docs plugin fetch content
      // this is an annoying way of doing it, but its the easiest way to do this without recoding most of the template
      await loadOxideHookDocumentation(context);

      // let docs plugin take it from here
      return docsPluginInstance.loadContent(...loadContentArgs);
    },
  };
}

module.exports = {
  ...docsPluginExports,
  default: oxide_docsPlugin,
};
