# docusaurus plugin to autogenerate oxide hook docs
> this is only meant to serve as a proof of concept

supply a JSON file to auto generate oxide hook documentation,
optionally supply markdown files to extend the documentation

## how it works
the plugin works by wrapping the default docusaurus "docs" plugin, its only purpose is to collect the patcher's JSON file & any markdown files, combine them into a single JSON object and forward it to the markdown template. 

## Quick-start
for a quick way to test it out, go to stack blitz to get a setup test environment for free
fork the setup version here ⇒ https://stackblitz.com/edit/github-xoofvf-4zcnzu?file=oxide_hookDocs/index.js

### Step1
Copy the oxide_hookDocs folder into docusaurus's root folder (not the src folder. The same root folder that holds the config file)

### Step2
Add the plugin in docusaurus's config file. It uses the same configuration as the default docs plugin
use the example below 
```js
  ...
  plugins: [
    [
      './oxide_hookDocs',
      {
        path: 'docs',
        breadcrumbs: true,
        // Simple use-case: string editUrl
        editUrl: 'this_gets_overridden_for_hooks_anyways_but_remember_to_set_this_for_non_hook_content',
        editLocalizedFiles: false,
        editCurrentVersion: false,
        routeBasePath: 'docs',
        include: ['**/*.md', '**/*.mdx'],
        exclude: [
          '**/_*.{js,jsx,ts,tsx,md,mdx}',
          '**/_*/**',
          '**/*.test.{js,jsx,ts,tsx}',
          '**/__tests__/**',
        ],
        sidebarPath: 'sidebars.js',
      },
    ],
  ],
  ...
```
NOTE: When using a preset (which the stack blitz setup is using) you need to make sure to set the docs in your preset settings to `false`, otherwise the plugins will conflict

### Step3
Go to /oxide_hookDocs/hooks/patcherOutput.json and insert your JSON file
see the one in this repo for a schema example.

Docusaurus will now build a documentation entry for every object in that JSON file when it gets built.

### Step4 (optional)
Go to /oxide_hookDocs/hooks/markdown and add 1 or more markdown files named after the hook you want to extend documentation for.

To extend the documentation, you can add 1 or more sections.

A section is some markdown content wrapped by some special HTML comments. Sections are identified by a specific ID. some sections have special places they get inserted to, while others will simply get appended at the bottom of the page

## Modify the Template
Before using this plugin, remember to adjust the template.js
you should make sure to change 'defaultEditUrl' and 'customEditBase' to the relevant GitHub links, but feel free to adjust the actual markdown that gets created
