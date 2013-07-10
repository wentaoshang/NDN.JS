
NDN.JS:  A javascript client library for Named Data Networking
==============================================================

NDN.JS is the first native version of the NDN protocol written in JavaScript.  It is wire
format compatible with PARC's CCNx. 

The project by the UCLA NDN team - for more information on NDN, see
	http://named-data.net/
	http://ndn.ucla.edu/
	
NDN.JS is open source under a license described in the file COPYING.  While the license
does not require it, we really would appreciate it if others would share their
contributions to the library if they are willing to do so under the same license. 

---

This is a young project, with minimal documentation that we are slowly enhancing.  Please
email Jeff Burke (jburke@remap.ucla.edu) with any questions. 

The primary goal of NDN.JS is to provide a pure Javascript implementation of the NDN API
that enables developers to create browser-based applications using Named Data Networking.
The approach requires no native code or signed Java applets, and thus can be delivered
over the current web to modern browsers with no hassle for the end user.

Additional goals for the project:
- Websockets transport (rather than TCP or UDP, which are not directly supported in
Javascript).
- Relatively lightweight and compact, to enable efficient use on the web.	
- Wire format compatible with PARC's CCNx implementation of NDN.
	
The library currently requires a remote NDN daemon, and has been tested with ccnd, from
the's CCNx package: http://ccnx.org/
	

JAVASCRIPT API
--------------

See files in js/  and examples in js/testing, js/examples

NDN.JS currently supports expressing Interests (and receiving data) and publishing Data
(that answers Interests).  This includes encoding and decoding data packets as well as
signing and verifying them using RSA keys.

** NDN connectivity **
The only way (for now) to get connectivity to other NDN nodes is via ccnd.  For the
Javascript API, a Websockets proxy that can communicate the target ccnd is currently
required.  Code for such a proxy (using Node.js) is in the wsproxy directory.  It
currently listens on port 9696 and passes messages (using either TCP or UDP) to ccnd on
the same host. 

** Including the scripts in a web page **
To use NDN.JS in a web page, one of two scripts must be included using a <script> tag:

1. ndn-js.js, a combined, compressed library designed for efficient distribution.  It can
be built using js/tools/build/make-js.sh     This is used in examples/ndn-ping.html

2. Helper.js, which loads each component script independently.  This is used in most of
the tests in testing/

** Example to retrieve content **
A simple example of the current API to express an Interest and receive data:

var ndn = new NDN();	// connect to a default hub/proxy
ndn.transport.connectWebSocket(ndn);
        
var AsyncGetClosure = function AsyncGetClosure() {
    // Inherit from Closure.
    Closure.call(this);
};		
AsyncGetClosure.prototype.upcall = function(kind, upcallInfo) {
    if (kind == Closure.UPCALL_CONTENT) {
        console.log("Received " + upcallInfo.contentObject.name.to_uri());
        console.log(upcallInfo.contentObject.content);
    }
    return Closure.RESULT_OK;
};

ndn.expressInterest(new Name("/ndn/ucla.edu/apps/ndn-js-test/hello.txt"), new
AsyncGetClosure());

** Example to publish content **

// Note that publishing content requires knowledge of a 
// routable prefix for your upstream ccnd.  We are working
// on a way to either obtain that prefix or use the /local
// convention. 

For now, see testing/test-publish-async.html

