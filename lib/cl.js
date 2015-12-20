// Process Command Line Arguments

// At this stage we only support a few flags,
// so it's OK to process them one by one like this
// If one day we need to process more command line arguments,
// it's better to find a 3rd party command line library to do this job.
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
