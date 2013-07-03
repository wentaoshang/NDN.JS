var Encoder = require('../build/ndn.js').CcnbEncoder;
var Decoder = require('../build/ndn.js').CcnbDecoder;
var Name = require('../build/ndn.js').Name;
var Interest = require('../build/ndn.js').Interest;
var ContentObject = require('../build/ndn.js').ContentObject;
var ContentType = require('../build/ndn.js').ContentType;
var Key = require('../build/ndn.js').Key;

var n = new Name('/a/b/c.txt');

console.log("Encoding/Decoding content object with KeyName...");

var content = "NDN on Node";
var key = new Key();
key.fromPemFile('./non.pub', './non.pem');

var keyname = new Name(n).appendKeyID(key);
console.log("KeyName: " + keyname.to_uri());

var co1 = new ContentObject(n, content);
co1.sign(key, {'keyName': keyname, 'contentType':ContentType.KEY})
console.log("Encoded ContentObject is:");
console.log(co1.to_xml());

try {
    var p2 = co1.encodeToBinary();
} catch (e) {
    console.log(e.toString());
}

var dec2 = new Decoder(p2);
var co2 = new ContentObject();
try {
    co2.from_ccnb(dec2);
} catch (e) {
    console.log(e.toString());
}
console.log('Decoded ContentObject in XML representation:');
console.log(co2.to_xml());