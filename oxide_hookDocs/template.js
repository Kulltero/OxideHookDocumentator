// returns filled out markdown based on the options present in the hookData
// potential fields present:
// slugName : string - the filename & url if present. falls back to just {hook}
// category : string - the hook category, this is also present in the URL
// returnType : string - the type the hook returns, used to determine the predefined text under Usage & return type in the code example
// funcName : string - the function name in the code example
// argumentTypes: array<string> -  a list of arguments used in the hook, types only at the moment
// sections: object<string, string> - an object of sections from a custom markdown file, only present if atleast 1 section is present
module.exports = async function jsonToMarkdown(hookData, hook) {
  const defaultEditUrl =
    'https://github.com/OxideMod/path/to/the/Documentation/To/Create/Custom/Markdown/For/A/Hook';
  const customEditBase =
    'https://github.com/OxideMod/base/folder/to/Markdown/files/'; // + {hook}.md

  // a list of section types we check for, this prevents them from being appended again at the bottom
  const standardSections = [
    'frontmatter',
    'afterTitle',
    'usageNotes',
    'usageReturnOverride',
    'afterUsage',
    'codeExamples',
  ];

  // shorthand checks
  let isVoid = hookData.returnType == 'void';
  let hasSections =
    hookData.hasOwnProperty('sections') &&
    Object.keys(hookData.sections).length > 0;

  let getSection = (key) => {
    if (!hasSections) return '';

    return hookData.sections.hasOwnProperty(key) ? hookData.sections[key] : '';
  };

  // frontmatter defined as an object - the reason its an object is so we can check for overridden values if a frontmatter section is present in the custom markdown
  // https://docusaurus.io/docs/api/plugins/@docusaurus/plugin-content-docs#markdown-front-matter
  const defaultFrontmatter = {
    hide_table_of_contents: true,
    custom_edit_url: hasSections
      ? customEditBase + hook + '.md'
      : defaultEditUrl,
  };

  var frontmatterText = createFrontmatter(
    defaultFrontmatter,
    hasSections && hookData.sections.hasOwnProperty('frontmatter')
      ? hookData.sections.frontmatter
      : ''
  );

  // construct main markdown body
  // dont move that line down, it breaks stuff apparently
  var markdown = `---
${frontmatterText}
---

# ${hookData.funcName}
#### Category: ${hookData.category}

${getSection('afterTitle')}

## Usage
${getSection('usageNotes')}
* ${
    getSection('usageReturnOverride') == ''
      ? isVoid
        ? 'No return behavior'
        : hookData.returnType.includes('bool')
        ? 'Return true to allow or false to deny the Action'
        : hookData.returnType.includes('Item')
        ? 'Return an Item to prevent default behavior & override the received Item'
        : 'Return a non-null value to override default behavior'
      : getSection('usageReturnOverride')
  }

${getSection('afterUsage')}

## Examples


`;
  // trust me i hate that mess above just as much as you do

  // add codeExamples if the section exists
  if (getSection('codeExamples') != '') {
    markdown += `${getSection('codeExamples')} \n`;
  } else {
    // generate shitty default
    markdown += createCodeExample(hookData);
  }

  // check if there are any other sections that weren't one of the standard ones and simply append them
  if (hasSections)
    for (let [secKey, seccontent] of Object.entries(hookData.sections)) {
      // section was already included in the markdown
      if (standardSections.includes(secKey)) continue;

      markdown += `${seccontent} \n`;
    }

  return markdown;
};

// creates a single string from the options object & the frontmatter defined in the custom markdown file
function createFrontmatter(options, customText, isNested = false) {
  for (let [opkey, opval] of Object.entries(options)) {
    //add indentation to the key if its a sub object;
    if (isNested) opkey = '  ' + opkey;

    // cehck if the text already includes a key for this option, add the : to the check to lower chance of false positives
    if (customText.includes(opkey + ':')) continue;

    // add a newline if there already is content
    if (customText !== '') customText += ' \n';

    // a sub object requires special handling, luckily this function is recursive at least once :>
    if (typeof opval == 'object') {
      customText += createFrontmatter(opval, opkey + ':', true);
    } else if (typeof opval == 'array') {
      // simply itterate over the values
      // this produces the following result:
      // key:
      //   - arg1
      //   - arg2
      // ...
      customText += opkey + ': \n  - ' + opval.join('\n  - ');
    } else if (typeof opval == 'bool') {
      customText += `${opkey}: ${opval ? 'true' : 'false'}`;
    } else {
      customText += `${opkey}: ${opval}`;
    }
  }

  return customText;
}

// create text example of hook wrapped in backticks
function createCodeExample(data) {
  let codeResult = `
  \`\`\` csharp title="Basic example"
  private ${data.returnType} ${data.funcName} (${getFunctionArgsString(
    data.argumentTypes
  )})
  {
    Puts("${data.funcName} Works!");
  
    return${data.returnType.includes('void') ? '' : ' null'};
  }
  \`\`\`
  `;
  return codeResult;
}

// format string array into function args
function getFunctionArgsString(args) {
  let usedArgNames = [];
  let result = '';
  for (let arg of args) {
    // ensure first leter of the varname is lowercase
    let lowered = arg.charAt(0).toLowerCase() + arg.slice(1);
    var varname = lowered;
    // if the type string was already lowercase or there's already an argument with the name, add an incrementing number to the variable name
    let i = 1;
    while (varname === arg || usedArgNames.includes(varname)) {
      varname = `${lowered}${i++}`;
      if (i >= 10) break;
    }
    usedArgNames.push(varname);
    // add Type & varname to the result string, prefixing a comma and space if its not empty
    result += (result != '' ? ', ' : '') + `${arg} ${varname}`;
  }
  return result;
}
