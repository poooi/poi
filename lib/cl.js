// Command Line

process.argv.forEach(function(arg) {
  if (/^-(-debug|d)$/i.test(arg)) {
    process.env.DEBUG = 1;
    console.log("Debug Mode");
  }
});
