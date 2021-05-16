/* note the encryption key is private. Do not reverse engineer */
/* 
  BEGIN LICENSE BLOCK

  SmartTemplates is released under the Creative Commons (CC BY-ND 4.0)
  Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
  For details, please refer to license.txt in the root folder of this extension

  END LICENSE BLOCK 
*/

export function getDecryption_key(key_type) {
  switch (key_type) {
    case 0:  // Pro
    case 2:  // Standard
      return "494d467df07bdf71e8f83d99e73f203f08bfaa9d8345b69a0b8069aff6b35569";
    case 1:  // domain
      return "68a025ffe52fd5cf9beaf0693b6e77e58278f6089f01bdac4afe965241f5cf8a5d9e25d0750091a7c8bcb3807909ddc290f00ed9ab6437d801ab1a2ac14cd5b";
    default:
      return -1; // unknown or free license
  }
}

export function getModulus(key_type) {
  switch (key_type) {
    case 0:  // Pro
    case 2:  // Standard
      return "49e2f5a409ecc3c96171df82f4cb0cbf274668e713008feb6d67f0ba45058ad5";
    case 1:  // domain
      return "12c127d3fb813f8bba7e863ab31c9943b76505f96cb87bfa9d4f9dc503a1bfe0c74e0057cff6ee9f3814fb90bc42207fdd908fbdb00cbf9a8f8c53dc7c4ed7b5";
    default:
      return -1; // unknown or free license
  }
}

// determine the type of key from the prefix - this is Add-on specific!
// extend this method to introduce other types of licenses.
export function getKeyType(licenseKey) {
  if (!licenseKey) 
    return 0; // default to Pro, but that doesn't mean there is a valid license!
  if (licenseKey.startsWith('STD')) {
    return 1; // Domain License
  } else if (licenseKey.startsWith('S1')) {
    return 2; // Standard License
  } else {
    return 0; // Pro License
  } // SmartTemplates uses "S1" for standard licenses with key_type=2
}


export function getMaxDigits(key_type) {
  switch (key_type) {
    case 0:  // Pro
    case 2:  // Standard
      return 35;
    case 1:  // domain
      return 67;
    default:
      return 0; // unknown or free license
  }
}
  
export function getKeyLength(key_type) {
  switch (key_type) {
    case 0:  // Pro
    case 2:  // Standard
      return 256;
    case 1:  // domain
      return 512;
    default:
      return 0; // unknown or free license
  }
}

