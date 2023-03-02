const { readFile, readdir } = require('node:fs/promises');
const path = require('path');

// loads the patcherOutput.json file & parses existing markdown files to extract any sections
// returns patcherOutput.json with a "sections" object added for any hooks that had matching files in the /markdown folder
module.exports = async function prepareHooksForMarkdown() {
  // load primary hook json from the patcher
  var file = await readFile(
    './oxide_hookDocs/hooks/patcherOutput.json',
    'utf-8'
  ).catch((err) => {
    console.error(
      'Primary oxide hooks JSON file not found or inaccesible. \n',
      err
    );
    return null;
  });
  if (file == null) return;
  let jsonData = JSON.parse(file);

  // if no hooks are found, return null
  if (typeof jsonData !== 'object') {
    console.error(
      'JSON provided was not an object, verify the schema in your patcherOutput.json file'
    );
    return null;
  }

  // Look for any markdown files, any file found will have it's data included in the hook json object
  let dirs = await readdir('./oxide_hookDocs/hooks/markdown');

  if (dirs.length > 0)
    for (let hookExtra of dirs) {
      // if the filename is not a valid hook, skip it.
      if (!jsonData.hasOwnProperty(hookExtra)) continue;

      // read markdown file
      let rawMarkdown = await readFile(
        path.combine('./oxide_hookDocs/hooks/markdown', hookExtra),
        'utf-8'
      );

      // skip if the file is empty
      if (!rawMarkdown || rawMarkdown.Length == 0) continue;

      // define section open & close strings
      const sectionOpen = '<!-- Section:';
      const sectionClose = '<!-- Section-End -->';

      // get an array of strings that contain the markdown for each section
      let sections = getFromBetween.get(rawMarkdown, sectionOpen, sectionClose);
      // an example: the following content
      // "<!-- Section: Example -->
      // Some Example Content
      // <!-- Section-End -->"
      // would be turned into the string
      // " Example -->
      // Some Example Content
      // "
      // note how the Section identifier (Example) is still contained in the section string, we can use this to identify the section while itterating over all sections

      for (let section of sections) {
        // get all text before the first "-->", this should only be Whitespace & the section identifier
        let sectionKey = section.split('-->')[0].trim();
        // if we cant find a section key, skip it as we wont be-able to reference this section in the template
        if (!sectionKey) continue;

        // get the rest of the section as a string, starting at the end of the "-->" identifier
        let sectionContent = section.substring(section.indexOf('-->') + 3);
        // using the example above this should result in the following setup:
        // sectionKey = "Example";
        // sectionContent = "Some Example Content";

        // add current section to the section array
        if (!jsonData[hookExtra].HasOwnProperty('sections'))
          jsonData[hookExtra]['sections'] = {};

        jsonData[hookExtra]['sections'][sectionKey] = sectionContent;
      }
    }

  // return the json object after adding all manual sections
  return jsonData;
};

// Utility functions, used to help with getting section content
var getFromBetween = {
  results: [],
  string: '',
  getFromBetween: function (sub1, sub2) {
    if (this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0)
      return false;
    var SP = this.string.indexOf(sub1) + sub1.length;
    var string1 = this.string.substr(0, SP);
    var string2 = this.string.substr(SP);
    var TP = string1.length + string2.indexOf(sub2);
    return this.string.substring(SP, TP);
  },
  removeFromBetween: function (sub1, sub2) {
    if (this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0)
      return false;
    var removal = sub1 + this.getFromBetween(sub1, sub2) + sub2;
    this.string = this.string.replace(removal, '');
  },

  // Utility functions
  getAllResults: function (sub1, sub2) {
    // first check to see if we do have both substrings
    if (this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return;

    // find one result
    var result = this.getFromBetween(sub1, sub2);
    // push it to the results array
    this.results.push(result);
    // remove the most recently found one from the string
    this.removeFromBetween(sub1, sub2);

    // if there's more substrings
    if (this.string.indexOf(sub1) > -1 && this.string.indexOf(sub2) > -1) {
      this.getAllResults(sub1, sub2);
    } else return;
  },
  get: function (string, sub1, sub2) {
    this.results = [];
    this.string = string;
    this.getAllResults(sub1, sub2);
    return this.results;
  },
};
