
NDN.JS:  A JavaScript development library for Named Data Networking
==============================================================

NDN.JS is the first native version of the NDN protocol written in JavaScript. It is wire format compatible with PARC's CCNx.

The project is produced by the UCLA NDN team - for more information on NDN, see http://named-data.net/ and http://ndn.ucla.edu/.
	
NDN.JS is open source under a license described in the file COPYING. While the license does not require it, we really would appreciate it if others would share their contributions to the library if they are willing to do so under the same license.

This is a young project, with minimal documentation that we are slowly enhancing. Please email Jeff Burke (jburke@remap.ucla.edu) with any questions. 

The primary goal of NDN.JS is to provide a pure Javascript implementation of the NDN API that enables developers to create browser-based applications using Named Data Networking. The approach requires no native code or signed Java applets, and thus can be delivered over the current web to modern browsers with no hassle for the end user.

Additional goals for the project:
- Websockets transport (rather than TCP or UDP, which are not directly supported in Javascript).
- Relatively lightweight and compact, to enable efficient use on the web.
- Wire format compatible with PARC's CCNx implementation of NDN.
	
The library currently requires a remote NDN daemon, and has been tested with ccnd, from CCNx package: http://ccnx.org/


JavaScript API
--------------

See files in js/ and examples in js/test.

NDN.JS currently supports expressing Interests (and receiving data) and publishing Data (that answers Interests). This includes encoding and decoding data packets as well as signing and verifying them using RSA keys.

* NDN connectivity

The only way (for now) to get connectivity to other NDN nodes is via ccnd.  For the JavaScript API, a Websockets proxy that can communicate the target ccnd is currently required.  Code for such a proxy (using Node.js) is in the wsproxy directory. It currently listens on port 9696 and passes messages (using either TCP or UDP) to ccnd on the same host. 

* Including the scripts in a web page

To use NDN.JS in a web page, include 'ndn.js' or 'ndn.min.js' using a script tag. 'ndn.min.js' is a combined, compressed library designed for efficient distribution. It can
be built using js/build/make-js.sh.

* Example to retrieve content

See test/test-fetch.html for a basic example.

* Example to publish content

See test/test-publish.html for a basic example.
