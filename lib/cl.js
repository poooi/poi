// Process Command Line Arguments

process.argv.forEach(function(arg) {
  "use strict";
  if (/^-(-debug|d)$/i.test(arg)) {
    process.env.DEBUG = 1;
    console.log("Debug Mode");
  } else if (/^--debug-plugin=\w[\w-]*$/i.test(arg)) {
    let name = arg.split("=")[1];
    process.env.DEBUG_PLUGIN = name;
    console.log("Debugging Plugin: " + name);
  }
});
