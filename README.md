
NDN.JS:  A JavaScript development library for Named Data Networking
===================================================================

This is the refactored NDN.JS library. It is based on the old version of NDN.JS library (see the master branch of https://github.com/named-data/ndn-js). The usage examples can be found in tests/ folder.

Changes from the old version
----------------------------

* Cleanup (literally) codebase and fix indentation mess.
* Update the crypto library to RSASign 3.1.5 (http://kjur.github.io/jsrsasign/).
* Remove ContentDecodingException prototype in BinaryXMLDecoder.js and use Error object instead.
* Remove unnecessary comments, most of which come from the Python or Java codes that the initial NDN.JS code copies.
* Cleanup unused and commented (including those 'not working' codes) functions in DataUtils.js and move DataUtils.js from lib/encoding/ folder to lib/util/ folder.
* Implement helper functions for Name object, including Name.append(), Name.appendKeyID(), Name.appendVersion(), Name.appendSegment(), Name.isPrefixOf(), Name.size(), Name.getSuffix(), Name.compareComponents(). Remove Name.getName() method and use Name.to_uri() instead.
* Implement to_xml() methods for all the NDN entities, such as Interest, ContentObject, etc.
* Implement Interest.encodeToBinary(), ContentObject.encodeToBinary(), ForwardingEntry.encodeToBinary() helpers and remove lib/encoding/EncodingUtils.js.
* Merge KeyManager object into Key object. Implement helper functions for Key object, such as Key.fromPem(), Key.publicToDER(), Key.privateToDER(), Key.getKeyID(), etc.
* Update KeyName object to make it working with KeyLocator object.
* Implement ContentObject.verify() and reimplement ContentObject.sign(), which automatically sets the SignedInfo object.
* Update SignedInfo prototype to allow ContentType to be parsed.
* Implement ContentObject.parse() as a shortcut to parse a ContentObject from a Uint8Array object.
* Rewrite lib/util/CCNTime.js.
* Merge WebSocketTransport.expressInterest up to NDN.expressInterest().
* Split BinaryXMLElementReader into a separate JS file under lib/encoding/ folder.
* Implement NDN.connect(), NDN.send(), NDN.close() helper functions.
* Add NDN.default_key field, which replaces the 'globalKeyManager' in the old library.
* Implement NDN.setDefaultKey() and NDN.getDefaultKey() helpers.
* Remove Closure.js. Use callback-based upcall interface (e.g. onData, onTimeout, onInterest event handlers).
* Remove signature verification operations from NDN.onMessage handler.
* Fix bug in PublisherPublicKeyDigest.js. Digest length should be 256 bits since we are using SHA256 digest algorithm.
* Rewrite all the test cases under tests/ folder. Use HTML5 style for all the .html files.
* Update make-js.js building tool. The compressed code is now called ndn.min.js while the uncompressed version is called ndn.js.
* Remove Helper.js. User should always use ndn.min.js.
