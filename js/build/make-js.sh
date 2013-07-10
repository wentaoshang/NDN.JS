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

cat ../WebSocketTransport.js \
  ../util/CCNProtocolDTags.js \
  ../util/CCNTime.js \
  ../util/DataUtils.js \
  ../Name.js \
  ../ContentObject.js \
  ../Interest.js \
  ../Key.js \
  ../PublisherID.js \
  ../PublisherPublicKeyDigest.js \
  ../ForwardingEntry.js \
  ../encoding/DynamicUint8Array.js \
  ../encoding/BinaryXMLEncoder.js \
  ../encoding/BinaryXMLDecoder.js \
  ../encoding/BinaryXMLStructureDecoder.js \
  ../encoding/BinaryXMLElementReader.js \
  ../securityLib/core.js \
  ../securityLib/sha256.js \
  ../securityLib/base64.js \
  ../securityLib/rsa.js \
  ../securityLib/rsa2.js \
  ../securityLib/crypto-1.0.js \
  ../securityLib/rsapem-1.1.js \
  ../securityLib/rsasign-1.2.js \
  ../securityLib/asn1hex-1.1.js \
  ../securityLib/x509-1.1.js \
  ../securityLib/jsbn.js \
  ../securityLib/jsbn2.js \
  ../NDN.js \
  > ndn.js

java -jar compiler/compiler.jar --js ndn.js --js_output_file ndn.min.js

echo "Done."