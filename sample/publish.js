var NDN = require('../').NDN;
var Name = require('../').Name;
var Interest = require('../').Interest;
var ContentObject = require('../').ContentObject;
//var Key = require('../').Key;

//var key = new Key();
//key.fromPemFile('./non.pub', './non.pem');

var onInterest = function (interest) {
    console.log('Interest received in callback.');

    var co = new ContentObject(interest.name, 'NDN on Node\n');
    co.sign(mykey);

    try {
	ndn.send(co);
    } catch (e) {
	console.log(e.toString());
    }
};

var ndn = new NDN();
var mykey = ndn.getDefaultKey();

ndn.onopen = function () {
    var n = new Name('/ndn/on/node/test');
    ndn.registerPrefix(n, onInterest);
    console.log('Prefix registered.');
};

ndn.connect();

console.log('Started...');