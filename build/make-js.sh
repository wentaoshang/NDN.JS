#!/bin/bash

if [ -e "ndn.js" ]
then
    rm ndn.js
fi

if [ -e "ndn.min.js" ]
then
    rm ndn.min.js
fi

echo "Start..."

cat ../lib/WebSocketTransport.js \
  ../lib/util/CCNProtocolDTags.js \
  ../lib/util/CCNTime.js \
  ../lib/util/DataUtils.js \
  ../lib/Name.js \
  ../lib/ContentObject.js \
  ../lib/Interest.js \
  ../lib/Key.js \
  ../lib/PublisherID.js \
  ../lib/PublisherPublicKeyDigest.js \
  ../lib/ForwardingEntry.js \
  ../lib/encoding/DynamicUint8Array.js \
  ../lib/encoding/BinaryXMLEncoder.js \
  ../lib/encoding/BinaryXMLDecoder.js \
  ../lib/encoding/BinaryXMLStructureDecoder.js \
  ../lib/encoding/BinaryXMLElementReader.js \
  ../contrib/securityLib/core.js \
  ../contrib/securityLib/sha256.js \
  ../contrib/securityLib/base64.js \
  ../contrib/securityLib/rsa.js \
  ../contrib/securityLib/rsa2.js \
  ../contrib/securityLib/crypto-1.0.js \
  ../contrib/securityLib/rsapem-1.1.js \
  ../contrib/securityLib/rsasign-1.2.js \
  ../contrib/securityLib/asn1hex-1.1.js \
  ../contrib/securityLib/x509-1.1.js \
  ../contrib/securityLib/jsbn.js \
  ../contrib/securityLib/jsbn2.js \
  ../lib/NDN.js \
  > ndn.js

java -jar compiler/compiler.jar --js ndn.js --js_output_file ndn.min.js

echo "Done."