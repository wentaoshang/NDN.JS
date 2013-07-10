/**
 * @author: Meki Cheraoui
 * See COPYING for copyright and distribution information.
 * This class represents Key Objects
 */

var Key = function Key () {
    this.publicKeyDer = null;     // Uint8Array
    this.publicKeyDigest = null;  // Uint8Array
    this.publicKeyPem = null;     // String
    this.privateKeyPem = null;    // String
};

Key.prototype.publicToDER = function () {
    return this.publicKeyDer;  // Buffer
};

Key.prototype.privateToDER = function () {
    // Remove the '-----XXX-----' from the beginning and the end of the key
    // and also remove any \n in the key string
    var lines = this.privateKeyPem.split('\n');
    priKey = "";
    for (var i = 1; i < lines.length - 1; i++)
	priKey += lines[i];
    return DataUtils.toNumbersFromBase64(priKey);    
};

Key.prototype.publicToPEM = function () {
    return this.publicKeyPem;
};

Key.prototype.privateToPEM = function () {
    return this.privateKeyPem;
};

Key.prototype.getKeyID = function () {
    return this.publicKeyDigest;
};

Key.prototype.readDerPublicKey = function (pub_der) {
    if (LOG > 4) console.log("Encode DER public key:\n" + DataUtils.toHex(pub_der));

    this.publicKeyDer = pub_der;

    var md = new KJUR.crypto.MessageDigest({alg: "sha256", prov: "cryptojs"});
    md.updateHex(DataUtils.toHex(this.publicKeyDer));
    var mdHex = md.digest();
    this.publicKeyDigest = DataUtils.toNumbers(mdHex);
    
    var keyStr = DataUtils.toBase64String(pub_der);
    var keyPem = "-----BEGIN PUBLIC KEY-----\n";
    for (var i = 0; i < keyStr.length; i += 64)
	keyPem += (keyStr.substr(i, 64) + "\n");
    keyPem += "-----END PUBLIC KEY-----";

    this.publicKeyPem = keyPem;

    if (LOG > 4) console.log("Convert public key to PEM format:\n" + this.publicKeyPem);
};

Key.prototype.fromPem = function (pub, pri) {
    if (pub == null || pri == null) {
	throw new Error('Cannot create Key object without PEM strings.');
    }

    // Read public key

    this.publicKeyPem = pub;
    if (LOG>4) console.log("Key.publicKeyPem: \n" + this.publicKeyPem);

    // Remove the '-----XXX-----' from the beginning and the end of the public key
    // and also remove any \n in the public key string
    var lines = pub.split('\n');
    pub = "";
    for (var i = 1; i < lines.length - 1; i++)
	pub += lines[i];
    this.publicKeyDer = DataUtils.toNumbersFromBase64(pub);
    if (LOG>4) console.log("Key.publicKeyDer: \n" + DataUtils.toHex(this.publicKeyDer));

    var md = new KJUR.crypto.MessageDigest({alg: "sha256", prov: "cryptojs"});
    md.updateHex(DataUtils.toHex(this.publicKeyDer));
    var mdHex = md.digest();
    this.publicKeyDigest = DataUtils.toNumbers(mdHex);
    if (LOG>4) console.log("Key.publicKeyDigest: \n" + DataUtils.toHex(this.publicKeyDigest));

    // Read private key

    this.privateKeyPem = pri;
    if (LOG>4) console.log("Key.privateKeyPem: \n" + this.privateKeyPem);
};

/**
 * KeyLocator
 */
var KeyLocatorType = {
    KEY:1,
    CERTIFICATE:2,
    KEYNAME:3
};

var KeyLocator = function KeyLocator(_input,_type){ 
    this.type = _type;
    
    if (_type == KeyLocatorType.KEYNAME){
    	if (LOG>3) console.log('KeyLocator: SET KEYNAME');
    	this.keyName = _input;  // KeyName
    }
    else if (_type == KeyLocatorType.KEY){
    	if (LOG>3) console.log('KeyLocator: SET KEY');
    	this.publicKey = _input;  // Key
    }
    else if (_type == KeyLocatorType.CERTIFICATE){
    	if (LOG>3) console.log('KeyLocator: SET CERTIFICATE');
    	this.certificate = _input;  // Uint8Array
    }
};

KeyLocator.prototype.from_ccnb = function (decoder) {
	decoder.readStartElement(this.getElementLabel());

	if (decoder.peekStartElement(CCNProtocolDTags.Key)) {
		try {
			encodedKey = decoder.readBinaryElement(CCNProtocolDTags.Key);
			// This is a DER-encoded SubjectPublicKeyInfo.
			
			//TODO FIX THIS, This should create a Key Object instead of keeping bytes

			this.publicKey =   encodedKey;//CryptoUtil.getPublicKey(encodedKey);
			this.type = KeyLocatorType.KEY;
			

			if(LOG>4) console.log('PUBLIC KEY FOUND: '+ this.publicKey);
			//this.publicKey = encodedKey;
			
			
		} catch (e) {
			throw new Error("Cannot parse key: ", e);
		} 

		if (null == this.publicKey) {
			throw new Error("Cannot parse key: ");
		}

	} else if ( decoder.peekStartElement(CCNProtocolDTags.Certificate)) {
		try {
			encodedCert = decoder.readBinaryElement(CCNProtocolDTags.Certificate);
			
			/*
			 * Certificates not yet working
			 */
			
			//CertificateFactory factory = CertificateFactory.getInstance("X.509");
			//this.certificate = (X509Certificate) factory.generateCertificate(new ByteArrayInputStream(encodedCert));
			

			this.certificate = encodedCert;
			this.type = KeyLocatorType.CERTIFICATE;

			if(LOG>4) console.log('CERTIFICATE FOUND: '+ this.certificate);
			
		} catch ( e) {
			throw new Error("Cannot decode certificate: " +  e);
		}
		if (null == this.certificate) {
			throw new Error("Cannot parse certificate! ");
		}
	} else  {
		this.type = KeyLocatorType.KEYNAME;
		
		this.keyName = new KeyName();
		this.keyName.from_ccnb(decoder);
	}
	decoder.readEndElement();
};
	

KeyLocator.prototype.to_ccnb = function( encoder) {
	
	if(LOG>4) console.log('type is is ' + this.type);
	//TODO Check if Name is missing
	if (!this.validate()) {
		throw new ContentEncodingException("Cannot encode " + this.getClass().getName() + ": field values missing.");
	}

	
	//TODO FIX THIS TOO
	encoder.writeStartElement(this.getElementLabel());
	
	if (this.type == KeyLocatorType.KEY) {
		if(LOG>5)console.log('About to encode a public key' +this.publicKey);
		encoder.writeElement(CCNProtocolDTags.Key, this.publicKey);
		
	} else if (this.type == KeyLocatorType.CERTIFICATE) {
		
		try {
			encoder.writeElement(CCNProtocolDTags.Certificate, this.certificate);
		} catch ( e) {
			throw new Error("CertificateEncodingException attempting to write key locator: " + e);
		}
		
	} else if (this.type == KeyLocatorType.KEYNAME) {
		
		this.keyName.to_ccnb(encoder);
	}
	encoder.writeEndElement();
	
};

KeyLocator.prototype.getElementLabel = function() {
	return CCNProtocolDTags.KeyLocator; 
};

KeyLocator.prototype.validate = function() {
	return (  (null != this.keyName) || (null != this.publicKey) || (null != this.certificate)   );
};

/**
 * KeyName is only used by KeyLocator.
 */
var KeyName = function KeyName() {
	this.contentName = this.contentName;  //contentName
	this.publisherID = this.publisherID;  //publisherID

};

KeyName.prototype.from_ccnb=function( decoder){
	

	decoder.readStartElement(this.getElementLabel());

	this.contentName = new Name();
	this.contentName.from_ccnb(decoder);
	
	if(LOG>4) console.log('KEY NAME FOUND: ');
	
	if ( PublisherID.peek(decoder) ) {
		this.publisherID = new PublisherID();
		this.publisherID.from_ccnb(decoder);
	}
	
	decoder.readEndElement();
};

KeyName.prototype.to_ccnb = function( encoder) {
	if (!this.validate()) {
		throw new Error("Cannot encode : field values missing.");
	}
	
	encoder.writeStartElement(this.getElementLabel());
	
	this.contentName.to_ccnb(encoder);
	if (null != this.publisherID)
		this.publisherID.to_ccnb(encoder);

	encoder.writeEndElement();   		
};
	
KeyName.prototype.getElementLabel = function() { return CCNProtocolDTags.KeyName; };

KeyName.prototype.validate = function() {
		// DKS -- do we do recursive validation?
		// null signedInfo ok
		return (null != this.contentName);
};

