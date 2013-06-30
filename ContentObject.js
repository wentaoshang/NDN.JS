/**
 * @author: Meki Cheraoui
 * See COPYING for copyright and distribution information.
 * This class represents ContentObject Objects
 */

/**
 * Ported to node.js by Wentao Shang
 */

var ContentObject = function ContentObject(_name, _signedInfo, _content, _signature) {	
    if (typeof _name == 'string') {
	this.name = new Name(_name);
    } else {
	//TODO Check the class of _name
	this.name = _name;
    }
    this.signedInfo = _signedInfo;
	
    if (typeof _content == 'string') {
	this.content = new Buffer(_content);
    } else {
	this.content = _content;
    }
	
    this.signature = _signature;

    this.startSIG = null;
    this.endSIG = null;
    this.signedData = null;
};

exports.ContentObject = ContentObject;

ContentObject.prototype.sign = function (/* Key */ key) {
    if (key == null) {
	console.log("Cannot sign data without a key :(");
	return;
    }
    var n1 = this.encodeObject(this.name);
    var n2 = this.encodeObject(this.signedInfo);
    var n3 = this.encodeContent();

    var rsa = require("crypto").createSign('RSA-SHA256');
    rsa.update(n1);
    rsa.update(n2);
    rsa.update(n3);
    
    var sig = new Buffer(rsa.sign(key.privateKey));

    this.signature.signature = sig;
};

ContentObject.prototype.encodeObject = function encodeObject(obj) {
    var enc = new BinaryXMLEncoder(); 
    obj.to_ccnb(enc);
    return enc.getReducedOstream();
};

ContentObject.prototype.encodeContent = function encodeContent(obj) {
    var enc = new BinaryXMLEncoder();
    enc.writeElement(CCNProtocolDTags.Content, this.content);
    return enc.getReducedOstream();	
};

ContentObject.prototype.saveSignedData = function (bytes) {
    var sig = bytes.slice(this.startSIG, this.endSIG);
    this.signedData = sig;
};

ContentObject.prototype.from_ccnb = function (decoder) {
    if (LOG > 4) console.log('--------Start decoding ContentObject...');

    decoder.readStartElement(this.getElementLabel());

    if (decoder.peekStartElement(CCNProtocolDTags.Signature)) {
	this.signature = new Signature();
	this.signature.from_ccnb(decoder);
    }

    this.startSIG = decoder.offset;

    this.name = new Name();
    this.name.from_ccnb(decoder);
    
    if (decoder.peekStartElement(CCNProtocolDTags.SignedInfo)) {
	this.signedInfo = new SignedInfo();
	this.signedInfo.from_ccnb(decoder);
    }
    
    this.content = decoder.readBinaryElement(CCNProtocolDTags.Content);

    this.endSIG = decoder.offset;
    	
    decoder.readEndElement();
    
    this.saveSignedData(decoder.istream);

    if (LOG > 4) console.log('--------Finish decoding ContentObject.');
};

ContentObject.prototype.to_ccnb = function (encoder) {
    if (LOG > 4) console.log('--------Encoding ContentObject...');

    encoder.writeStartElement(this.getElementLabel());

    if (null != this.signature)
	this.signature.to_ccnb(encoder);
    
    this.startSIG = encoder.offset;
    
    if (null != this.name)
	this.name.to_ccnb(encoder);
    
    if (null != this.signedInfo)
	this.signedInfo.to_ccnb(encoder);

    encoder.writeElement(CCNProtocolDTags.Content, this.content);

    this.endSIG = encoder.offset;
    
    encoder.writeEndElement();
    
    //this.saveSignedData(encoder.ostream);

    if (LOG > 4) console.log('--------Finish encoding ContentObject');
};

ContentObject.prototype.encodeToBinary = function () {
    var enc = new BinaryXMLEncoder();
    this.to_ccnb(enc);
    return enc.getReducedOstream();
};

ContentObject.prototype.getElementLabel = function () { return CCNProtocolDTags.ContentObject; };

/**
 * Signature
 */
var Signature = function Signature(_witness, _signature, _digestAlgorithm) {
    this.Witness = _witness;//byte [] _witness;
    this.signature = _signature;//byte [] _signature;
    this.digestAlgorithm = _digestAlgorithm//String _digestAlgorithm;
};

exports.Signature = Signature;

Signature.prototype.from_ccnb = function (decoder) {
    if(LOG>4) console.log('--------Start decoding Signature...');

    decoder.readStartElement(this.getElementLabel());	
		
    if (decoder.peekStartElement(CCNProtocolDTags.DigestAlgorithm)) {
	if(LOG>4)console.log('DIGIEST ALGORITHM FOUND');
	this.digestAlgorithm = decoder.readUTF8Element(CCNProtocolDTags.DigestAlgorithm); 
    }
    if (decoder.peekStartElement(CCNProtocolDTags.Witness)) {
	if(LOG>4)console.log('WITNESS FOUND');
	this.Witness = decoder.readBinaryElement(CCNProtocolDTags.Witness); 
    }
		
    //FORCE TO READ A SIGNATURE

    if(LOG>4)console.log('SIGNATURE FOUND');
    this.signature = decoder.readBinaryElement(CCNProtocolDTags.SignatureBits);

    decoder.readEndElement();

    if(LOG>4) console.log('--------Finish decoding Signature.');
};


Signature.prototype.to_ccnb = function (encoder) {
    if (LOG > 4) console.log('--------Encoding Signature...');

    if (!this.validate()) {
	throw new Error("Cannot encode: field values missing.");
    }
	
    encoder.writeStartElement(this.getElementLabel());
/*
    if ((null != this.digestAlgorithm) && (!this.digestAlgorithm.equals(CCNDigestHelper.DEFAULT_DIGEST_ALGORITHM))) {
	encoder.writeElement(CCNProtocolDTags.DigestAlgorithm, OIDLookup.getDigestOID(this.DigestAlgorithm));
    }
	
    if (null != this.Witness) {
	// needs to handle null witness
	encoder.writeElement(CCNProtocolDTags.Witness, this.Witness);
    }
*/
    encoder.writeElement(CCNProtocolDTags.SignatureBits, this.signature);

    encoder.writeEndElement();

    if (LOG > 4) console.log('--------Finish encoding Signature.');
};

Signature.prototype.getElementLabel = function() { return CCNProtocolDTags.Signature; };

Signature.prototype.validate = function() {
    return null != this.signature;
};


/**
 * SignedInfo
 */
var ContentType = {DATA:0, ENCR:1, GONE:2, KEY:3, LINK:4, NACK:5};
var ContentTypeValue = {0:0x0C04C0, 1:0x10D091,2:0x18E344,3:0x28463F,4:0x2C834A,5:0x34008A};
var ContentTypeValueReverse = {0x0C04C0:0, 0x10D091:1,0x18E344:2,0x28463F:3,0x2C834A:4,0x34008A:5};

var SignedInfo = function SignedInfo(_publisher, _timestamp, _type, _locator, _freshnessSeconds, _finalBlockID) {
    this.publisher = _publisher; //publisherPublicKeyDigest
    this.timestamp = _timestamp; // CCN Time
    this.type = _type; // ContentType
    this.locator = _locator; //KeyLocator
    this.freshnessSeconds = _freshnessSeconds; // Integer
    this.finalBlockID = _finalBlockID; //byte array
};

exports.SignedInfo = SignedInfo;

SignedInfo.prototype.setFields = function (/* Key */ key) {
    var publicKeyBytes = key.publicKey; // Buffer
    
    var hash = require("crypto").createHash('sha256');
    hash.update(publicKeyBytes);
    var publisherKeyDigest = new Buffer(hash.digest());

    this.publisher = new PublisherPublicKeyDigest(publisherKeyDigest);
    
    var d = new Date();
    var time = d.getTime();

    this.timestamp = new CCNTime(time);
    
    if(LOG>4)console.log('TIME msec is');
    if(LOG>4)console.log(this.timestamp.msec);
    
    this.type = ContentType.DATA;  // default

    this.locator = new KeyLocator(publicKeyBytes, KeyLocatorType.KEY);
};

SignedInfo.prototype.from_ccnb = function (decoder) {
    if (LOG > 4) console.log('--------Start decoding SignedInfo...');

    decoder.readStartElement( this.getElementLabel() );
		
    if (decoder.peekStartElement(CCNProtocolDTags.PublisherPublicKeyDigest)) {
	if(LOG>4)console.log('DECODING PUBLISHER KEY');
	this.publisher = new PublisherPublicKeyDigest();
	this.publisher.from_ccnb(decoder);
    }

    if (decoder.peekStartElement(CCNProtocolDTags.Timestamp)) {
	if(LOG>4)console.log('DECODING TIMESTAMP');
	this.timestamp = decoder.readDateTime(CCNProtocolDTags.Timestamp);
    }

    if (decoder.peekStartElement(CCNProtocolDTags.Type)) {
	binType = decoder.readBinaryElement(CCNProtocolDTags.Type);//byte [] 

	//TODO Implement type of Key Reading

	if(LOG>4)console.log('Binary Type of of Signed Info is '+ binType);

	this.type = binType;			
			
	//TODO Implement type of Key Reading

	if (null == this.type) {
	    throw new Error("Cannot parse signedInfo type: bytes.");
	}
			
    } else {
	this.type = ContentType.DATA; // default
    }
    
    if (decoder.peekStartElement(CCNProtocolDTags.FreshnessSeconds)) {
	this.freshnessSeconds = decoder.readIntegerElement(CCNProtocolDTags.FreshnessSeconds);
	if(LOG>4)console.log('FRESHNESS IN SECONDS IS '+ this.freshnessSeconds);
    }
		
    if (decoder.peekStartElement(CCNProtocolDTags.FinalBlockID)) {
	if(LOG>4)console.log('DECODING FINAL BLOCKID');
	this.finalBlockID = decoder.readBinaryElement(CCNProtocolDTags.FinalBlockID);
    }
		
    if (decoder.peekStartElement(CCNProtocolDTags.KeyLocator)) {
	if(LOG>4)console.log('DECODING KEY LOCATOR');
	this.locator = new KeyLocator();
	this.locator.from_ccnb(decoder);
    }
    
    decoder.readEndElement();

    if (LOG > 4) console.log('--------Finish decoding SignedInfo.');
};

SignedInfo.prototype.to_ccnb = function (encoder) {
    if (LOG > 4) console.log('--------Encoding SignedInfo...');

    if (!this.validate()) {
	throw new Error("Cannot encode : field values missing.");
    }
    
    encoder.writeStartElement(this.getElementLabel());
    	
    if (null != this.publisher) {
	this.publisher.to_ccnb(encoder);
    }
    
    if (null != this.timestamp) {
	encoder.writeDateTime(CCNProtocolDTags.Timestamp, this.timestamp);
    }
    	
    if (null != this.type && this.type != ContentType.DATA) {
	encoder.writeElement(CCNProtocolDTags.type, this.type);
    }
    
    if (null != this.freshnessSeconds) {
	encoder.writeElement(CCNProtocolDTags.FreshnessSeconds, this.freshnessSeconds);
    }

    if (null != this.finalBlockID) {
	encoder.writeElement(CCNProtocolDTags.FinalBlockID, this.finalBlockID);
    }

    if (null != this.locator) {
	this.locator.to_ccnb(encoder);
    }

    encoder.writeEndElement();

    if (LOG > 4) console.log('--------Finish encoding SignedInfo.');
};


SignedInfo.prototype.getElementLabel = function () { 
    return CCNProtocolDTags.SignedInfo;
};


SignedInfo.prototype.validate = function () {
    // We don't do partial matches any more, even though encoder/decoder
    // is still pretty generous.
    if (null == this.publisher || null == this.timestamp || null == this.locator)
	return false;
    else
	return true;
};