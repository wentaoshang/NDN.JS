/**
 * @author: Meki Cherkaoui, Jeff Thompson, Wentao Shang
 * See COPYING for copyright and distribution information.
 * This class represents the top-level object for communicating with an NDN host.
 */

/**
 * Ported to node.js by Wentao Shang
 */
var Name = require('./Name.js').Name;
var Interest = require('./Interest.js').Interest;
var ContentObject = require('./ContentObject.js').ContentObject;
var ForwardingEntry = require('./ForwardingEntry.js').ForwardingEntry;
var BinaryXMLDecoder = require('./util/BinaryXMLDecoder.js').BinaryXMLDecoder;
var CCNProtocolDTags = require('./util/CCNProtocolDTags.js').CCNProtocolDTags;
var Key = require('./Key.js').Key;
var KeyLocatorType = require('./Key.js').KeyLocatorType;
var TcpTransport = require('./TcpTransport.js').TcpTransport;

var LOG = 0;

/**
 * NDN wrapper
 */
var NDN = function NDN(settings) {
    settings = (settings || {});
    this.transport = new TcpTransport();
    this.host = (settings.host !== undefined ? settings.host : 'localhost');
    this.port = (settings.port || 9696);
    this.ready_status = NDN.UNOPEN;

    // Event handler
    this.onopen = function () { console.log("NDN connection established."); };
    this.onclose = function () { console.log("NDN connection closed."); };

    this.ccndid = null;
    this.default_key = new Key();
    this.default_key.fromPemString(
	// Public Key
	"-----BEGIN PUBLIC KEY-----\n" +
	"MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDNpgZFC23yGSLsMo8mzTcmdni\n" +
	"pkUHI+i8CYagTEqHO+PnejF9Ep/D+MBvEtPXHSgExsDCHP8X7B6If1df58OWXB9G\n" +
	"PnXUsAsjKKXgOaKoMJr9NZXPqlBbJSrT0h5590hCm2ePPUVkvJKsOX6gCFnptbLz\n" +
	"F7pvb3zKDc+zXjyHPwIDAQAB\n" +
	"-----END PUBLIC KEY-----",
	// Private Key
	"-----BEGIN RSA PRIVATE KEY-----\n" +
	"MIICXAIBAAKBgQDDNpgZFC23yGSLsMo8mzTcmdnipkUHI+i8CYagTEqHO+PnejF9\n" +
	"Ep/D+MBvEtPXHSgExsDCHP8X7B6If1df58OWXB9GPnXUsAsjKKXgOaKoMJr9NZXP\n" +
	"qlBbJSrT0h5590hCm2ePPUVkvJKsOX6gCFnptbLzF7pvb3zKDc+zXjyHPwIDAQAB\n" +
	"AoGBALR4BTayI+3SkblekChlaAJFLVxOUGRgeylTOSV6QjAxWulFWvkAvbijf+tv\n" +
	"oW4uIy//OnZ57g6EmFmiN/mOvo3meBvWijHxUJG1suKrEgG8Gm0LZn0CyycTtutl\n" +
	"ziSDJ3F4whEZfuqciAFOTTgAXPRHMa/cZbSDo4aGR5mbqE0ZAkEA3+HmB/1SgwMB\n" +
	"bopCmkh+sslFhtD2xUxlXnlC3ur4rOmjtH7YE0Q2UDsJFj9eg/BA4fQ/orh9usGv\n" +
	"AVph7o6lswJBAN830Xc7cjxeF3vQyJk1vqqPf15FGvkraq7gHb5MPAtofh78PtzD\n" +
	"+hyblvWAYBstR/K6up1KG+LP6RXA43q7qkUCQA49540wjzQoV8n5X51C6VRkO1kF\n" +
	"J/2LC5PD8P4PQnx1bGWKACLRnwbhioVwyIlqGiaFjBrE07KyqXhTkJFFX8MCQAjW\n" +
	"qfmhpfVT+HQToU3HvgP86Jsv+1Bwcqn3/9WAKUR+X7gUXtzY+bdWRdT0v1l0Iowu\n" +
	"7qK5w37oop8U4y0B700CQBKRizBt1Nc02UMDzdamQsgnRjuIjlfmryfZpemyx238\n" +
	"Q0s2+cKlqbfDOUY/CAj/z1M6RaISQ0TawCX9NIGa9GI=\n" +
	"-----END RSA PRIVATE KEY-----"
	);
};

NDN.prototype.setDefaultKey = function (pubfile, prifile) {
    this.default_key = new Key();
    this.default_key.fromPemFile(pubfile, prifile);
};

NDN.prototype.getDefaultKey = function () {
    return this.default_key;
};

exports.NDN = NDN;

NDN.UNOPEN = 0;  // created but not opened yet
NDN.OPENED = 1;  // connection to ccnd opened
NDN.CLOSED = 2;  // connection to ccnd closed

NDN.ccndIdFetcher = new Name('/%C1.M.S.localhost/%C1.M.SRV/ccnd/KEY');

// Private callback fired by TcpTransport when TCP connection is established
NDN.prototype.fetchCcndId = function () {
    var i = new Interest(NDN.ccndIdFetcher);
    i.interestLifetime = 1000; // milliseconds
    this.transport.send(i.encodeToBinary());
};

// Private callback fired by TcpTransport when TCP connection is closed by remote host
NDN.prototype.closeByTransport = function () {
    this.ready_status = NDN.CLOSED;
    this.onclose();
};

// Connect NDN wrapper to local ccnd
NDN.prototype.connect = function () {
    if (this.ready_status == NDN.OPENED)
	throw new Error('Cannot connect because NDN connection is already opened.');

    this.transport.connect(this);
};

// Send packet through NDN wrapper
NDN.prototype.send = function (packet) {
    if (this.ready_status != NDN.OPENED)
	throw new Error('Cannot send because NDN connection is not opened.');
    
    if (packet instanceof Buffer)
	this.transport.send(packet);
    else if (packet instanceof Interest || packet instanceof ContentObject)
	this.transport.send(packet.encodeToBinary());
    else
	throw new Error('Cannot send object of type ' + packet.constructor.name);
};

// Close NDN wrapper
NDN.prototype.close = function () {
    if (this.ready_status != NDN.OPENED)
	throw new Error('Cannot close because NDN connection is not opened.');

    this.ready_status = NDN.CLOSED;
    this.transport.close();
};

// For fetching data
var PITTable = new Array();

var PITEntry = function PITEntry(interest) {
    this.interest = interest;  // Interest
    this.closure = [];    // Closure array
    this.timerID = -1;  // Timer ID
};

// Return the longest entry from PITTable that matches name.
var getEntryForExpressedInterest = function (/*Name*/ name) {
    var result = null;
    
    for (var i = 0; i < PITTable.length; i++) {
	if (PITTable[i].interest.matches_name(name)) {
            if (result == null || 
                PITTable[i].interest.name.components.length > result.interest.name.components.length)
                result = PITTable[i];
        }
    }
    
    return result;
};

var findIdenticalInterest = function (name) {
    for (var i = 0; i < PITTable.length; i++) {
	if (PITTable[i].interest.name.equals(name)) {
	    //XXX: different selectors are ignored for now
	    return PITTable[i];
        }
    }

    return null;
};

// For publishing data
var CSTable = new Array();

var CSEntry = function CSEntry(name, closure) {
    this.name = name;        // Name
    this.closure = closure;  // Closure
};

var getEntryForRegisteredPrefix = function (name) {
    for (var i = 0; i < CSTable.length; i++) {
	if (CSTable[i].name.isPrefixOf(name))
	    return CSTable[i];
    }
    return null;
};


/**
 * Prototype of 'onData': function (interest, contentObject) {}
 * Prototype of 'onTimeOut': function (interest) {}
 */
NDN.prototype.expressInterest = function (name, template, onData, onTimeOut) {
    if (this.ready_status != NDN.OPENED) {
	throw new Error('NDN connection is not established.');
    }

    var closure = new DataClosure(onData, onTimeOut);
    
    // Check existing entry first
    var entry = findIdenticalInterest(name);
    if (entry != null && entry.closure != null) {
	entry.closure.push(closure);
	return;
    }

    var interest = new Interest(name);
    if (template != null) {
	interest.minSuffixComponents = template.minSuffixComponents;
	interest.maxSuffixComponents = template.maxSuffixComponents;
	interest.publisherPublicKeyDigest = template.publisherPublicKeyDigest;
	interest.exclude = template.exclude;
	interest.childSelector = template.childSelector;
	interest.answerOriginKind = template.answerOriginKind;
	interest.scope = template.scope;
	interest.interestLifetime = template.interestLifetime;
    }
    else
        interest.interestLifetime = 4000;   // default interest timeout value in milliseconds.

    var pitEntry = new PITEntry(interest);
    pitEntry.closure.push(closure);
    PITTable.push(pitEntry);

    if (interest.interestLifetime == null)
	// Use default timeout value
	interest.interestLifetime = 4000;
	
    if (interest.interestLifetime > 0 && closure.onTimeout != null) {
	pitEntry.timerID = setTimeout(function() {
		if (LOG > 3) console.log("Interest time out.");
					
		// Remove PIT entry from PITTable.
		var index = PITTable.indexOf(pitEntry);
		if (index >= 0)
		    PITTable.splice(index, 1);
					
		// Raise timeout callback
		var arr_cb = pitEntry.closure;
		for (var i = 0; i < arr_cb.length; i++) {
		    if (arr_cb[i].onTimeout != null)
			arr_cb[i].onTimeout(pitEntry.interest);
		}
	    }, interest.interestLifetime);  // interestLifetime is in milliseconds.
	//console.log(closure.timerID);
    }

    this.transport.send(interest.encodeToBinary());
};

/**
 * Prototype of 'onInterest': function (interest) {}
 */
NDN.prototype.registerPrefix = function(prefix, onInterest) {
    if (this.ready_status != NDN.OPENED) {
	throw new Error('NDN connection is not established.');
    }

    if (this.ccndid == null) {
	throw new Error('ccnd node ID unkonwn. Cannot register prefix.');
    }

    if (this.default_key == null) {
	throw new Error('Cannot register prefix without default key');
    }
    
    var fe = new ForwardingEntry('selfreg', prefix, null, null, 3, 2147483647);
    var feBytes = fe.encodeToBinary();

    var co = new ContentObject(new Name(), feBytes);
    co.sign(this.default_key);  // Use default key to sign registration packet
    var coBinary = co.encodeToBinary();

    var interestName = new Name(['ccnx', this.ccndid, 'selfreg', coBinary]);
    var interest = new Interest(interestName);
    interest.scope = 1;
    
    var closure = new InterestClosure(onInterest);
    var csEntry = new CSEntry(prefix, closure);
    CSTable.push(csEntry);

    var data = interest.encodeToBinary();
    this.transport.send(data);

    if (LOG > 3) console.log('Prefix registration packet sent.');
};

/**
 * This is called when an entire binary XML element is received, such as a ContentObject or Interest.
 */
NDN.prototype.onMessage = function(msg) {
    if (LOG > 4) console.log('Complete message received. Length ' + msg.length + '. Start decoding.');
    
    var decoder = new BinaryXMLDecoder(msg);
    // Dispatch according to packet type
    if (decoder.peekStartElement(CCNProtocolDTags.Interest)) {  // Interest packet
	var interest = new Interest();
	interest.from_ccnb(decoder);
	
	if (LOG > 3) console.log('Interest name is ' + interest.name.to_uri());
	
	var entry = getEntryForRegisteredPrefix(interest.name);
	if (entry != null && entry.closure != null && entry.closure.onInterest != null) {
	    entry.closure.onInterest(interest);
	}				
    } else if (decoder.peekStartElement(CCNProtocolDTags.ContentObject)) {  // Content packet
	var co = new ContentObject();
	co.from_ccnb(decoder);

	if (LOG > 3) console.log('ContentObject name is ' + co.name.to_uri());

	if (this.ccndid == null && NDN.ccndIdFetcher.isPrefixOf(co.name)) {
	    // We are in starting phase, record publisherPublicKeyDigest in ccndid
	    if(!co.signedInfo || !co.signedInfo.publisher 
	       || !co.signedInfo.publisher.publisherPublicKeyDigest) {
		console.log("Cannot contact router, close NDN now.");
		
		// Close NDN if we fail to connect to a ccn router
		this.ready_status = NDN.CLOSED;
		this.transport.close();
	    } else {
		if (LOG>3) console.log('Connected to local ccnd.');
		this.ccndid = co.signedInfo.publisher.publisherPublicKeyDigest;
		if (LOG>3) console.log('Local ccnd ID is ' + this.ccndid.toString('hex'));
		
		// Call NDN.onopen after success
		this.ready_status = NDN.OPENED;
		this.onopen();
	    }
	} else {
	    var pitEntry = getEntryForExpressedInterest(co.name);
	    if (pitEntry != null) {
		// Remove PIT entry from PITTable
		var index = PITTable.indexOf(pitEntry);
		if (index >= 0)
		    PITTable.splice(index, 1);

		var arr_cb = pitEntry.closure;
		
		// Cancel interest timer
		clearTimeout(pitEntry.timerID);

		// No signature verification
		for (var i = 0; i < arr_cb.length; i++) {
		    var cl = arr_cb[i];
		    if (cl.onData != null)
			cl.onData(pitEntry.interest, co);
		}
	    }
	}
    }
};

var DataClosure = function DataClosure(onData, onTimeout) {
    this.onData = onData;
    this.onTimeout = onTimeout;
};

var InterestClosure = function InterestClosure(onInterest) {
    this.onInterest = onInterest;
};
