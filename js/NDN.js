/**
 * @author: Meki Cherkaoui, Jeff Thompson, Wentao Shang
 * See COPYING for copyright and distribution information.
 * This class represents the top-level object for communicating with an NDN host.
 */

var LOG = 0;

/**
 * settings is an associative array with the following defaults:
 * {
 *   host: 'localhost', // If null, use getHostAndPort when connecting.
 *   port: 9696,
 *   onopen: function() { if (LOG > 3) console.log("NDN connection established."); }
 *   onclose: function() { if (LOG > 3) console.log("NDN connection closed."); }
 * }
 * 
 */
var NDN = function NDN(settings) {
    settings = (settings || {});
    this.transport = new WebSocketTransport();
    this.host = (settings.host !== undefined ? settings.host : 'localhost');
    this.port = (settings.port || 9696);
    this.readyStatus = NDN.UNOPEN;
    // Event handler
    this.onopen = (settings.onopen || function() { if (LOG > 3) console.log("NDN connection established."); });
    this.onclose = (settings.onclose || function() { if (LOG > 3) console.log("NDN connection closed."); });
    this.ccndid = null;
};

NDN.UNOPEN = 0;  // created but not opened yet
NDN.OPENED = 1;  // connection to ccnd opened
NDN.CLOSED = 2;  // connection to ccnd closed

NDN.ccndIdFetcher = new Name('/%C1.M.S.localhost/%C1.M.SRV/ccnd/KEY');

NDN.prototype.createRoute = function(host, port) {
    this.host=host;
    this.port=port;
};


// For fetching data
NDN.PITTable = new Array();

var PITEntry = function PITEntry(interest, closure) {
    this.interest = interest;  // Interest
    this.closure = closure;    // Closure
    this.timerID = -1;  // Timer ID
};

// Return the longest entry from NDN.PITTable that matches name.
NDN.getEntryForExpressedInterest = function(/*Name*/ name) {
    var result = null;
    
    for (var i = 0; i < NDN.PITTable.length; i++) {
	if (NDN.PITTable[i].interest.matches_name(name)) {
            if (result == null || 
                NDN.PITTable[i].interest.name.components.length > result.interest.name.components.length)
                result = NDN.PITTable[i];
        }
    }
    
    return result;
};

// For publishing data
NDN.CSTable = new Array();

var CSEntry = function CSEntry(name, closure) {
    this.name = name;        // Name
    this.closure = closure;  // Closure
};

function getEntryForRegisteredPrefix(/* Name */ name) {
    for (var i = 0; i < NDN.CSTable.length; i++) {
	if (NDN.CSTable[i].name.match(name) != null)
	    return NDN.CSTable[i];
    }
    return null;
};

/** Encode name as an Interest. If template is not null, use its attributes.
 *  Send the interest to host:port, read the entire response and call
 *  closure.upcall(Closure.UPCALL_CONTENT (or Closure.UPCALL_CONTENT_UNVERIFIED),
 *                 new UpcallInfo(this, interest, 0, contentObject)).                 
 */
NDN.prototype.expressInterest = function(
    // Name
    name,
    // Closure
    closure,
    // Interest
    template) {
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

    this.transport.expressInterest(this, interest, closure);
};

NDN.prototype.registerPrefix = function(name, closure) {
    if (this.readyStatus != NDN.OPENED) {
	console.log('Connection is not established.');
        return -1;
    }

    if (this.ccndid == null) {
	console.log('ccnd node ID unkonwn. Cannot register prefix.');
	return -1;
    }
		
    var fe = new ForwardingEntry('selfreg', name, null, null, 3, 2147483647);
    var bytes = encodeForwardingEntry(fe);
		
    var si = new SignedInfo();
    si.setFields();
		
    var co = new ContentObject(new Name(), si, bytes, new Signature()); 
    co.sign();
    var coBinary = encodeToBinaryContentObject(co);
		
    var nodename = this.ccndid;
    var interestName = new Name(['ccnx', nodename, 'selfreg', coBinary]);

    var interest = new Interest(interestName);
    interest.scope = 1;
    if (LOG > 3) console.log('Send Interest registration packet.');
    	
    var csEntry = new CSEntry(name, closure);
    NDN.CSTable.push(csEntry);
    
    this.transport.send(encodeToBinaryInterest(interest));
		
    return 0;
};

/*
 * This is called when an entire binary XML element is received, such as a ContentObject or Interest.
 * Look up in the PITTable and call the closure callback.
 */
NDN.prototype.onReceivedElement = function(element) {
    if (LOG>4) console.log('Complete element received. Length ' + element.length + '. Start decoding.');

    var decoder = new BinaryXMLDecoder(element);
    // Dispatch according to packet type
    if (decoder.peekStartElement(CCNProtocolDTags.Interest)) {  // Interest packet
	var interest = new Interest();
	interest.from_ccnb(decoder);

	if (LOG > 3) console.log('Interest name is ' + interest.name.to_uri());
				
	var entry = getEntryForRegisteredPrefix(name);
	if (entry != null) {
	    //console.log(entry);
	    entry.closure.onInterest(interest);
	}				
    } else if (decoder.peekStartElement(CCNProtocolDTags.ContentObject)) {  // Content packet
	var co = new ContentObject();
	co.from_ccnb(decoder);

	if (LOG > 3) console.log('ContentObject name is ' + co.name.to_uri());
				
	if (this.ccndid == null && NDN.ccndIdFetcher.match(co.name)) {
	    // We are in starting phase, record publisherPublicKeyDigest in ccndid
	    if(!co.signedInfo || !co.signedInfo.publisher 
	       || !co.signedInfo.publisher.publisherPublicKeyDigest) {
		console.log("Cannot contact router, close NDN now.");
						
		// Close NDN if we fail to connect to a ccn router
		this.readyStatus = NDN.CLOSED;
		this.onclose();
		//console.log("NDN.onclose event fired.");
	    } else {
		if (LOG>3) console.log('Connected to ccnd.');
		this.ccndid = co.signedInfo.publisher.publisherPublicKeyDigest;
		if (LOG>3) console.log(ndn.ccndid);
						
		// Call NDN.onopen after success
		this.readyStatus = NDN.OPENED;
		this.onopen();
		//console.log("NDN.onopen event fired.");
	    }
	} else {
	    var pitEntry = NDN.getEntryForExpressedInterest(co.name);
	    if (pitEntry != null) {
		//console.log(pitEntry);
		// Remove PIT entry from NDN.PITTable
		var index = NDN.PITTable.indexOf(pitEntry);
		if (index >= 0)
		    NDN.PITTable.splice(index, 1);
						
		var currentClosure = pitEntry.closure;
						
		// Cancel interest timer
		clearTimeout(pitEntry.timerID);

                // Key verification
		// We only verify the signature when the KeyLocator contains KEY bits

		if (co.signedInfo && co.signedInfo.locator && co.signature && co.signature.signature) {
		    if (co.signature.Witness != null) {
			// Bypass verification if Witness is present
			cl.onData(pitEntry.interest, co, NDN.CONTENT_UNVERIFIED);
			return;
		    }

		    var keylocator = co.signedInfo.locator;
		    if (keylocator.type == KeyLocatorType.KEY) {
			if (LOG > 3) console.log("Keylocator contains KEY.\n");

			var flag = (co.verify(keylocator.publicKey) == true) ? NDN.CONTENT : NDN.CONTENT_BAD;
			cl.onData(pitEntry.interest, co, flag);
		    } else {
			if (LOG > 3) console.log("KeyLocator does not contain KEY. Leave for user to verify data.");
			cl.onData(pitEntry.interest, co, NDN.CONTENT_UNVERIFIED);
		    }
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
