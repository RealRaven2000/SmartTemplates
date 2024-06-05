export function logMissingFunction(txt) {
  // Log missing items for Conversion to Thunderbird 115
  console.log(`SmartTemplates %c[issue 259] to do: %c ${txt} `, 
    "color:darkred", 
    "background: darkred; color:yellow;");
}
