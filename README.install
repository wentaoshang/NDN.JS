NDN.JS: A JavaScript development library for Named Data Networking
==================================================================

BUILD A COMBINED, COMPRESSED LIBRARY 
------------------------------------

An efficient way to include the library is to used the combined and compressed library 
ndn.min.js that can be made using the waf tool.

To create a combined and optionally compressed version of NDN.JS scripts:

    ./waf configure --no-ws --prefix=<PREFIX_TO_INSTALL_JS> 
    ./waf install

These commands will create a combined version, combined version compressed using Google's
Closure Compiler, and install it into <PREFIX_TO_INSTALL_JS> folder.

If you just want to build the compressed library:

    ./waf configure
    ./waf

The combined ndn.js and compressed ndn.min.js files will be ready in build/ folder.

The compressed version is what we recommend including in applications.


WEBSOCKETS PROXY
----------------

If you wish to run your own WebSockets proxy instead of using the NDN testbed, you must
build and install Node.js (often on the machine also running the ccnd you wish to proxy
for, but that doesn't have to be the case).  See wsproxy/README.md
